import mongoose, { Schema, Types } from "mongoose";

export const REQUEST_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "ON_THE_WAY",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "UNASSIGNED",
] as const;

interface EmergencyRequestFields {
  customerId: Types.ObjectId;
  category: string;
  description: string;
  photoData?: string;
  address: string;
  location?: { lat: number; lng: number } | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: (typeof REQUEST_STATUSES)[number];
  assignedTechnician: Types.ObjectId | null;
  attemptedTechnicians: Types.ObjectId[];
  acceptanceDeadline: Date | null;
  completedAt: Date | null;
}

const emergencyRequestSchema = new Schema<EmergencyRequestFields>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    photoData: {
      type: String,
      maxlength: 1800000,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "HIGH",
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: "PENDING",
    },
    assignedTechnician: {
      type: Schema.Types.ObjectId,
      ref: "Technician",
      default: null,
    },
    attemptedTechnicians: [{
      type: Schema.Types.ObjectId,
      ref: "Technician",
    }],
    acceptanceDeadline: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

emergencyRequestSchema.index({ customerId: 1, createdAt: -1 });
emergencyRequestSchema.index({ status: 1, createdAt: -1 });

export const EmergencyRequest = mongoose.model<EmergencyRequestFields>(
  "EmergencyRequest",
  emergencyRequestSchema
);
