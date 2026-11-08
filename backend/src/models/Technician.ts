import mongoose, { Schema, Types } from "mongoose";

interface TechnicianFields {
  userId: Types.ObjectId;
  skills: string[];
  isOnline: boolean;
  isAvailable: boolean;
  activeRequest: Types.ObjectId | null;
  location?: { lat: number; lng: number } | null;
  serviceRadiusKm: number;
}

const technicianSchema = new Schema<TechnicianFields>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      required: true,
      default: [],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    activeRequest: {
      type: Schema.Types.ObjectId,
      ref: "EmergencyRequest",
      default: null,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    serviceRadiusKm: {
      type: Number,
      default: 15,
      min: 1,
      max: 100,
    },
  },
  { timestamps: true }
);

export const Technician = mongoose.model<TechnicianFields>(
  "Technician",
  technicianSchema
);
