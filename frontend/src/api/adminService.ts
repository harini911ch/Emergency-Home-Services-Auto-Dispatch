import api from "./client";
import type { EmergencyRequest } from "./requestService";

export interface AdminTechnician {
  _id: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
  };
  skills?: string[];
  isOnline?: boolean;
  isAvailable?: boolean;
  serviceRadiusKm?: number;
}

export const adminService = {
  async getAllRequests(): Promise<EmergencyRequest[]> {
    const response = await api.get("/requests/admin/all");
    return response.data.data;
  },

  async getTechnicians(): Promise<AdminTechnician[]> {
    const response = await api.get("/admin/technicians");
    return response.data.data;
  },

  async createTechnician(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    skills: string[];
    serviceRadiusKm: number;
    location: { lat: number; lng: number };
  }) {
    const response = await api.post("/admin/technicians", data);
    return response.data;
  },

  async updateTechnicianStatus(id: string, isActive: boolean) {
    const response = await api.patch(`/admin/technicians/${id}/status`, {
      isActive,
    });
    return response.data;
  },
};
