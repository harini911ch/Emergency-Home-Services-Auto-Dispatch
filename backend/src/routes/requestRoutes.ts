import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createRequest,
  getMyRequests,
  getAssignedRequests,
  getTechnicianHistory,
  getTechnicianProfile,
  updateAvailability,
  updateLocation,
  respondToAssignment,
  updateRequestStatus,
  cancelRequest,
  getAllRequests,

} from "../controllers/requestController.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("CUSTOMER"), createRequest);
router.get("/mine", authorize("CUSTOMER"), getMyRequests);
router.patch(
  "/:requestId/cancel",
  authorize("CUSTOMER"),
  cancelRequest
);

router.get("/technician/assigned", authorize("TECHNICIAN"), getAssignedRequests);
router.get("/technician/history", authorize("TECHNICIAN"), getTechnicianHistory);
router.get("/technician/profile", authorize("TECHNICIAN"), getTechnicianProfile);
router.patch("/technician/availability", authorize("TECHNICIAN"), updateAvailability);
router.patch("/technician/location", authorize("TECHNICIAN"), updateLocation);
router.patch(
  "/:requestId/respond",
  authorize("TECHNICIAN"),
  respondToAssignment
);
router.patch(
  "/:requestId/status",
  authorize("TECHNICIAN"),
  updateRequestStatus
);

router.get("/admin/all", authorize("ADMIN"), getAllRequests);

export default router;
