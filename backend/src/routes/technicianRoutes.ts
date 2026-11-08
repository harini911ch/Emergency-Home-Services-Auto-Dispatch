import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createTechnician,
  getTechnicians,
  updateTechnicianStatus,
} from "../controllers/technicianController.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/", createTechnician);
router.get("/", getTechnicians);
router.patch("/:technicianId/status", updateTechnicianStatus);

export default router;
