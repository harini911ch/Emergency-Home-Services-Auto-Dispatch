import { EmergencyRequest } from "../models/EmergencyRequest.js";
import { releaseTechnician, dispatchRequest } from "./dispatchService.js";

let isProcessing = false;

export const processExpiredAssignments = async (): Promise<void> => {
  if (isProcessing) return;

  isProcessing = true;

  try {
    const now = new Date();

    const expiredRequests = await EmergencyRequest.find({
      status: "ASSIGNED",
      assignedTechnician: { $ne: null },
      acceptanceDeadline: { $lte: now },
    })
      .select("_id assignedTechnician")
      .limit(50);

    for (const request of expiredRequests) {
      const technicianId = request.assignedTechnician?.toString();

      if (!technicianId) continue;

      // Atomically claim this expired assignment so it cannot
      // be recovered twice by this worker.
      const recovered = await EmergencyRequest.findOneAndUpdate(
        {
          _id: request._id,
          status: "ASSIGNED",
          assignedTechnician: request.assignedTechnician,
          acceptanceDeadline: { $lte: now },
        },
        {
          $set: {
            status: "PENDING",
            assignedTechnician: null,
            acceptanceDeadline: null,
          },
        },
        { new: true }
      );

      if (!recovered) continue;

      await releaseTechnician(
        technicianId,
        request._id.toString()
      );

      const reassigned = await dispatchRequest(
        request._id.toString()
      );

      console.log(
        `[Dispatch Recovery] Request ${request._id}: ${
          reassigned ? "reassigned" : "no eligible technician available"
        }`
      );
    }
  } catch (error) {
    console.error("[Dispatch Recovery] Worker error:", error);
  } finally {
    isProcessing = false;
  }
};

export const startDispatchRecoveryWorker = (): void => {
  console.log("Dispatch recovery worker started (5-second interval).");

  void processExpiredAssignments();

  setInterval(() => {
    void processExpiredAssignments();
  }, 5000);
};
