import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Technician } from "../models/Technician.js";
import {
  createTechnicianSchema,
  technicianStatusSchema,
} from "../validators/technicianValidator.js";

export const createTechnician = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parsed = createTechnicianSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid technician details",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  let createdUserId: mongoose.Types.ObjectId | null = null;

  try {
    const {
      name,
      email,
      phone,
      password,
      skills,
      location,
      serviceRadiusKm,
    } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: "TECHNICIAN",
    });

    createdUserId = user._id;

    const normalizedSkills = [
      ...new Set(skills.map((skill) => skill.trim().toLowerCase())),
    ];

    const technician = await Technician.create({
      userId: user._id,
      skills: normalizedSkills,
      location,
      serviceRadiusKm: serviceRadiusKm ?? 15,
      isOnline: false,
      isAvailable: true,
      activeRequest: null,
    });

    res.status(201).json({
      success: true,
      message: "Technician account created successfully",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        technician,
      },
    });
  } catch (error) {
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "An account or technician profile already exists",
      });
      return;
    }

    console.error("Technician creation error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create technician account",
    });
  }
};

export const getTechnicians = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const technicians = await Technician.find()
      .populate("userId", "name email phone role isActive")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    console.error("Get technicians error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve technicians",
    });
  }
};

export const updateTechnicianStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const technicianId = String(req.params.technicianId ?? "");
  const parsed = technicianStatusSchema.safeParse(req.body);

  if (!mongoose.isValidObjectId(technicianId) || !parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid technician ID or account status",
    });
    return;
  }

  try {
    const technician = await Technician.findById(technicianId);

    if (!technician) {
      res.status(404).json({
        success: false,
        message: "Technician profile not found",
      });
      return;
    }

    if (!parsed.data.isActive && technician.activeRequest) {
      res.status(409).json({
        success: false,
        message: "This technician has an active emergency request",
      });
      return;
    }

    const user = await User.findById(technician.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Technician user account not found",
      });
      return;
    }

    user.isActive = parsed.data.isActive;
    await user.save();

    technician.isOnline = false;
    technician.isAvailable = parsed.data.isActive;
    await technician.save();

    res.status(200).json({
      success: true,
      message: parsed.data.isActive
        ? "Technician account activated"
        : "Technician account deactivated",
      data: {
        technicianId: technician._id.toString(),
        isActive: user.isActive,
        isOnline: technician.isOnline,
        isAvailable: technician.isAvailable,
      },
    });
  } catch (error) {
    console.error("Technician status update error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update technician account",
    });
  }
};
