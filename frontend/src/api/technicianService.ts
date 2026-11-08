import api from "./client";
import type { EmergencyRequest } from "./requestService";

export interface TechnicianProfile {
  isOnline: boolean;
  isAvailable: boolean;
  location?: { lat: number; lng: number } | null;
  serviceRadiusKm: number;
}

export const technicianService = {
  async getProfile(): Promise<TechnicianProfile> {
    const response = await api.get("/requests/technician/profile");
    return response.data.data;
  },

  async getAssigned(): Promise<EmergencyRequest[]> {
    const response = await api.get("/requests/technician/assigned");
    return response.data.data;
  },

  async getHistory(): Promise<EmergencyRequest[]> {
    const response = await api.get("/requests/technician/history");
    return response.data.data;
  },

  async updateAvailability(isOnline: boolean) {
    const response = await api.patch("/requests/technician/availability", {
      isOnline,
    });
    return response.data;
  },

  async updateLocation(lat: number, lng: number) {
    const response = await api.patch("/requests/technician/location", {
      lat,
      lng,
    });
    return response.data;
  },

  async respond(requestId: string, decision: "ACCEPT" | "REJECT") {
    const response = await api.patch(`/requests/${requestId}/respond`, {
      decision,
    });
    return response.data;
  },

  async updateStatus(
    requestId: string,
    status: "IN_PROGRESS" | "COMPLETED"
  ) {
    const response = await api.patch(`/requests/${requestId}/status`, {
      status,
    });
    return response.data;
  },
};
