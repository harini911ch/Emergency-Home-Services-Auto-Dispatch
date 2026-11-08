import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { EmergencyRequest } from "../models/EmergencyRequest.js";
import { Technician } from "../models/Technician.js";
import { dispatchRequest, releaseTechnician } from "../services/dispatchService.js";
import { notifyAdmins, notifyUser } from "../services/socketService.js";

const createRequestSchema = z.object({
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(5).max(2000),
  photoData: z.string()
    .max(1800000)
    .regex(/^data:image\/(?:jpeg|png|webp);base64,/)
    .optional(),
  address: z.string().trim().min(5).max(300),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const createRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parsed = createRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid emergency request",
      errors: parsed.error.issues,
    });
    return;
  }

  try {
    const { photoData, ...requestData } = parsed.data;

    const request = await EmergencyRequest.create({
      ...requestData,
      ...(photoData ? { photoData } : {}),
      category: parsed.data.category.toLowerCase(),
      priority: parsed.data.priority ?? "HIGH",
      customerId: new mongoose.Types.ObjectId(req.user!.userId),
      status: "PENDING",
      assignedTechnician: null,
      attemptedTechnicians: [],
      acceptanceDeadline: null,
      completedAt: null,
    });

    const assigned = await dispatchRequest(request._id.toString());

    const latestRequest = await EmergencyRequest.findById(request._id)
      .populate({
        path: "assignedTechnician",
        populate: { path: "userId", select: "name phone" },
      });

    res.status(201).json({
      success: true,
      message: assigned
        ? "Emergency request created and technician assigned"
        : "Request created. No eligible technician is currently available.",
      data: latestRequest,
    });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create emergency request",
    });
  }
};

export const getMyRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requests = await EmergencyRequest.find({
    customerId: req.user!.userId,
  })
    .populate({
      path: "assignedTechnician",
      populate: { path: "userId", select: "name phone" },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: requests });
};

export const getAssignedRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  const technician = await Technician.findOne({ userId: req.user!.userId });

  if (!technician) {
    res.status(404).json({
      success: false,
      message: "Technician profile not found",
    });
    return;
  }

  const requests = await EmergencyRequest.find({
    assignedTechnician: technician._id,
    status: { $nin: ["COMPLETED", "CANCELLED"] },
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: requests });
};

export const updateAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parsed = z.object({
    isOnline: z.boolean(),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid availability value",
    });
    return;
  }

  const technician = await Technician.findOneAndUpdate(
    { userId: req.user!.userId, activeRequest: null },
    { $set: { isOnline: parsed.data.isOnline } },
    { new: true }
  );

  if (!technician) {
    res.status(409).json({
      success: false,
      message: "Technician profile not found or has an active request",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Availability updated",
    data: technician,
  });
};

export const updateLocation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parsed = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid location",
    });
    return;
  }

  const technician = await Technician.findOneAndUpdate(
    { userId: req.user!.userId },
    { $set: { location: parsed.data } },
    { new: true }
  );

  if (!technician) {
    res.status(404).json({
      success: false,
      message: "Technician profile not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Location updated",
    data: technician.location,
  });
};

export const getTechnicianProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const technician = await Technician.findOne({ userId: req.user!.userId });

  if (!technician) {
    res.status(404).json({
      success: false,
      message: "Technician profile not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      isOnline: technician.isOnline,
      isAvailable: technician.isAvailable,
      location: technician.location,
      serviceRadiusKm: technician.serviceRadiusKm,
    },
  });
};

export const respondToAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parsed = z.object({
    decision: z.enum(["ACCEPT", "REJECT"]),
  }).safeParse(req.body);

  const requestId = String(req.params.requestId ?? "");

  if (!parsed.success || !mongoose.isValidObjectId(requestId)) {
    res.status(400).json({
      success: false,
      message: "Invalid assignment response",
    });
    return;
  }

  const technician = await Technician.findOne({ userId: req.user!.userId });

  if (!technician) {
    res.status(404).json({
      success: false,
      message: "Technician profile not found",
    });
    return;
  }

  if (parsed.data.decision === "ACCEPT") {
    const acceptedRequest = await EmergencyRequest.findOneAndUpdate(
      {
        _id: requestId,
        assignedTechnician: technician._id,
        status: "ASSIGNED",
        $or: [
          { acceptanceDeadline: null },
          { acceptanceDeadline: { $gt: new Date() } },
        ],
      },
      {
        $set: {
          status: "ON_THE_WAY",
          acceptanceDeadline: null,
        },
      },
      { new: true }
    );

    if (!acceptedRequest) {
      const currentRequest = await EmergencyRequest.findOne({
        _id: requestId,
        assignedTechnician: technician._id,
        status: "ASSIGNED",
      }).select("acceptanceDeadline");

      if (
        currentRequest?.acceptanceDeadline &&
        currentRequest.acceptanceDeadline.getTime() <= Date.now()
      ) {
        res.status(409).json({
          success: false,
          message: "The acceptance deadline has expired. Ask the system to retry dispatch.",
        });
        return;
      }

      res.status(409).json({
        success: false,
        message: "Assignment is no longer active or has already changed.",
      });
      return;
    }

    notifyUser(acceptedRequest.customerId.toString(), {
      title: "Technician accepted your request",
      message: "Your technician has accepted the assignment and is on the way.",
      type: "STATUS",
      requestId,
    });

    notifyAdmins({
      title: "Technician accepted assignment",
      message: "A technician has accepted an emergency service request.",
      type: "INFO",
      requestId,
    });

    res.status(200).json({
      success: true,
      message: "Assignment accepted successfully.",
      data: acceptedRequest,
    });
    return;
  }

  const rejectedRequest = await EmergencyRequest.findOneAndUpdate(
    {
      _id: requestId,
      assignedTechnician: technician._id,
      status: "ASSIGNED",
    },
    {
      $set: {
        assignedTechnician: null,
        status: "PENDING",
        acceptanceDeadline: null,
      },
    },
    { new: true }
  );

  if (!rejectedRequest) {
    res.status(409).json({
      success: false,
      message: "Assignment is no longer active or has already changed.",
    });
    return;
  }

  await releaseTechnician(
    technician._id.toString(),
    requestId
  );

  notifyAdmins({
    title: "Technician declined assignment",
    message: "A technician declined an emergency request. The dispatch system is looking for another technician.",
    type: "WARNING",
    requestId,
  });

  const reassigned = await dispatchRequest(requestId);
  const latestRequest = await EmergencyRequest.findById(requestId);

  res.status(200).json({
    success: true,
    message: reassigned
      ? "Assignment rejected and request reassigned."
      : "Assignment rejected. No eligible technician is currently available.",
    data: latestRequest,
  });
};

export const updateRequestStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parsed = z.object({
    status: z.enum(["IN_PROGRESS", "COMPLETED"]),
  }).safeParse(req.body);

  const requestId = String(req.params.requestId ?? "");

  if (!parsed.success || !mongoose.isValidObjectId(requestId)) {
    res.status(400).json({
      success: false,
      message: "Invalid status update",
    });
    return;
  }

  const technician = await Technician.findOne({
    userId: req.user!.userId,
  });

  if (!technician) {
    res.status(404).json({
      success: false,
      message: "Technician profile not found",
    });
    return;
  }

  let updatedRequest;

  if (parsed.data.status === "IN_PROGRESS") {
    updatedRequest = await EmergencyRequest.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(requestId),
        assignedTechnician: technician._id,
        status: "ON_THE_WAY",
      },
      {
        $set: { status: "IN_PROGRESS" },
      },
      { new: true }
    );
  } else {
    updatedRequest = await EmergencyRequest.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(requestId),
        assignedTechnician: technician._id,
        status: "IN_PROGRESS",
      },
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  if (!updatedRequest) {
    res.status(409).json({
      success: false,
      message: "Invalid request status transition",
    });
    return;
  }

  if (parsed.data.status === "COMPLETED") {
    await releaseTechnician(
      technician._id.toString(),
      updatedRequest._id.toString()
    );

    notifyUser(updatedRequest.customerId.toString(), {
      title: "Service completed",
      message: "Your emergency home service has been completed successfully.",
      type: "STATUS",
      requestId,
    });

    notifyAdmins({
      title: "Service completed",
      message: "An emergency service request has been completed.",
      type: "INFO",
      requestId,
    });
  } else {
    notifyUser(updatedRequest.customerId.toString(), {
      title: "Technician started the service",
      message: "Your technician has started working on your emergency request.",
      type: "STATUS",
      requestId,
    });

    notifyAdmins({
      title: "Service in progress",
      message: "A technician has started an emergency service request.",
      type: "INFO",
      requestId,
    });
  }

  res.status(200).json({
    success: true,
    message: "Request status updated",
    data: updatedRequest,
  });
};

export const getAllRequests = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const requests = await EmergencyRequest.find()
    .populate("customerId", "name email phone")
    .populate({
      path: "assignedTechnician",
      populate: { path: "userId", select: "name phone" },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: requests });
};

export const cancelRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestId = String(req.params.requestId ?? "");

  if (!mongoose.isValidObjectId(requestId)) {
    res.status(400).json({
      success: false,
      message: "Invalid request ID",
    });
    return;
  }

  const previousRequest = await EmergencyRequest.findOneAndUpdate(
    {
      _id: requestId,
      customerId: req.user!.userId,
      status: { $in: ["PENDING", "ASSIGNED", "UNASSIGNED"] },
    },
    {
      $set: {
        status: "CANCELLED",
        assignedTechnician: null,
        acceptanceDeadline: null,
      },
    },
    { new: false }
  );

  if (!previousRequest) {
    res.status(409).json({
      success: false,
      message: "Request cannot be cancelled or does not belong to you",
    });
    return;
  }

  const technicianId = previousRequest.assignedTechnician?.toString();

  if (technicianId) {
    const assignedTechnician = await Technician.findById(technicianId)
      .select("userId");

    if (assignedTechnician) {
      notifyUser(assignedTechnician.userId.toString(), {
        title: "Emergency request cancelled",
        message: "The customer has cancelled the emergency service request assigned to you.",
        type: "WARNING",
        requestId,
      });
    }

    await releaseTechnician(
      technicianId,
      previousRequest._id.toString()
    );
  }

  notifyAdmins({
    title: "Emergency request cancelled",
    message: "A customer has cancelled an emergency service request.",
    type: "WARNING",
    requestId,
  });

  const cancelledRequest = await EmergencyRequest.findById(requestId);

  res.status(200).json({
    success: true,
    message: "Emergency request cancelled successfully",
    data: cancelledRequest,
  });
};
export const getTechnicianHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const technician = await Technician.findOne({
      userId: req.user!.userId,
    });

    if (!technician) {
      res.status(404).json({
        success: false,
        message: "Technician profile not found",
      });
      return;
    }

    const requests = await EmergencyRequest.find({
      assignedTechnician: technician._id,
      status: "COMPLETED",
    })
      .sort({ completedAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Technician history error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve completed jobs",
    });
  }
};
