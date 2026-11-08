import mongoose from "mongoose";
import { Technician } from "../models/Technician.js";
import { EmergencyRequest } from "../models/EmergencyRequest.js";
import { notifyAdmins, notifyUser } from "./socketService.js";

const ACCEPTANCE_WINDOW_MS = 60 * 1000;

const calculateDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRadians = (degrees: number): number =>
    (degrees * Math.PI) / 180;

  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
};

export const dispatchRequest = async (
  requestId: string
): Promise<boolean> => {
  const request = await EmergencyRequest.findById(requestId);

  if (
    !request ||
    !request.location ||
    ["COMPLETED", "CANCELLED"].includes(request.status)
  ) {
    return false;
  }

  const candidates = await Technician.find({
    isOnline: true,
    isAvailable: true,
    activeRequest: null,
    skills: request.category,
    _id: { $nin: request.attemptedTechnicians },
  });

  const rankedCandidates = candidates
    .filter((technician) => technician.location != null)
    .map((technician) => ({
      technician,
      distance: calculateDistanceKm(
        request.location!.lat,
        request.location!.lng,
        technician.location!.lat,
        technician.location!.lng
      ),
    }))
    .filter(({ technician, distance }) =>
      distance <= technician.serviceRadiusKm
    )
    .sort((a, b) => a.distance - b.distance);

  for (const candidate of rankedCandidates) {
    const claimedTechnician = await Technician.findOneAndUpdate(
      {
        _id: candidate.technician._id,
        isOnline: true,
        isAvailable: true,
        activeRequest: null,
      },
      {
        $set: {
          isAvailable: false,
          activeRequest: request._id,
        },
      },
      { new: true }
    );

    if (!claimedTechnician) {
      continue;
    }

    const updatedRequest = await EmergencyRequest.findOneAndUpdate(
      {
        _id: request._id,
        status: { $in: ["PENDING", "UNASSIGNED"] },
        assignedTechnician: null,
      },
      {
        $set: {
          assignedTechnician: claimedTechnician._id,
          status: "ASSIGNED",
          acceptanceDeadline: new Date(Date.now() + ACCEPTANCE_WINDOW_MS),
        },
        $addToSet: {
          attemptedTechnicians: claimedTechnician._id,
        },
      },
      { new: true }
    );

    if (!updatedRequest) {
      await Technician.updateOne(
        { _id: claimedTechnician._id, activeRequest: request._id },
        {
          $set: { isAvailable: true, activeRequest: null },
        }
      );
      return false;
    }

    const technicianUser = await Technician.findById(
      claimedTechnician._id
    ).select("userId");

    if (technicianUser) {
      notifyUser(technicianUser.userId.toString(), {
        title: "New emergency assignment",
        message: `A ${request.category} service request has been assigned to you. Please respond within 60 seconds.`,
        type: "ASSIGNMENT",
        requestId: request._id.toString(),
      });
    }

    notifyUser(request.customerId.toString(), {
      title: "Technician assigned",
      message: `A technician has been assigned to your ${request.category} service request.`,
      type: "STATUS",
      requestId: request._id.toString(),
    });

    notifyAdmins({
      title: "Emergency request assigned",
      message: `A ${request.category} request has been assigned to a technician.`,
      type: "INFO",
      requestId: request._id.toString(),
    });

    return true;
  }

  await EmergencyRequest.updateOne(
    { _id: request._id, assignedTechnician: null },
    { $set: { status: "UNASSIGNED", acceptanceDeadline: null } }
  );

  notifyUser(request.customerId.toString(), {
    title: "No technician available",
    message: `No available technician could be assigned to your ${request.category} request yet. Our system will retry when an eligible technician becomes available.`,
    type: "WARNING",
    requestId: request._id.toString(),
  });

  notifyAdmins({
    title: "Request needs attention",
    message: `No eligible technician was found for a ${request.category} emergency request.`,
    type: "WARNING",
    requestId: request._id.toString(),
  });

  return false;
};

export const releaseTechnician = async (
  technicianId: string,
  requestId: string
): Promise<void> => {
  await Technician.updateOne(
    {
      _id: technicianId,
      activeRequest: new mongoose.Types.ObjectId(requestId),
    },
    {
      $set: {
        activeRequest: null,
        isAvailable: true,
      },
    }
  );
};
