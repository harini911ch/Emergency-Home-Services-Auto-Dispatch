import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { USER_ROLES, User, type UserRole } from "../models/User.js";

interface NotificationPayload {
  title: string;
  message: string;
  type: "ASSIGNMENT" | "STATUS" | "INFO" | "WARNING";
  requestId?: string;
}

let socketServer: Server | null = null;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return secret;
};

export const initializeSocket = (
  httpServer: HttpServer,
  clientUrl: string
): void => {
  socketServer = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  socketServer.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== "string" || !token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = jwt.verify(token, getJwtSecret());

      if (
        typeof decoded === "string" ||
        typeof decoded.userId !== "string" ||
        typeof decoded.role !== "string" ||
        !USER_ROLES.includes(decoded.role as UserRole)
      ) {
        return next(new Error("Invalid authentication token"));
      }

      const user = await User.findById(decoded.userId).select(
        "_id role isActive"
      );

      if (
        !user ||
        !user.isActive ||
        user.role !== decoded.role
      ) {
        return next(new Error("User is inactive or unauthorized"));
      }

      socket.data.userId = user._id.toString();
      socket.data.role = user.role;

      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  socketServer.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as UserRole;

    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    console.log(
      `[Socket.IO] Connected: ${userId} (${role})`
    );

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Disconnected: ${userId}`);
    });
  });

  console.log("Socket.IO notification service initialized.");
};

export const notifyUser = (
  userId: string,
  notification: NotificationPayload
): void => {
  socketServer?.to(`user:${userId}`).emit("notification:new", {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
};

export const notifyAdmins = (
  notification: NotificationPayload
): void => {
  socketServer?.to("role:ADMIN").emit("notification:new", {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
};
