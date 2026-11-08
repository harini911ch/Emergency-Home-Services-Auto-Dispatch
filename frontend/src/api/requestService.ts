import api from "./client";

export interface EmergencyRequest {
  _id: string;
  category: string;
  description: string;
  photoData?: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status:
    | "PENDING"
    | "ASSIGNED"
    | "ON_THE_WAY"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "UNASSIGNED";
  assignedTechnician?: {
    location?: {
      lat: number;
      lng: number;
    } | null;
    userId?: {
      name?: string;
      phone?: string;
    };
  } | null;
  createdAt?: string;
  completedAt?: string | null;
}

export interface CreateRequestData {
  category: string;
  description: string;
  photoData?: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export const requestService = {
  async create(data: CreateRequestData): Promise<EmergencyRequest> {
    const response = await api.post("/requests", data);
    return response.data.data;
  },

  async getMine(): Promise<EmergencyRequest[]> {
    const response = await api.get("/requests/mine");
    return response.data.data;
  },

  async cancel(requestId: string): Promise<EmergencyRequest> {
    const response = await api.patch(`/requests/${requestId}/cancel`);
    return response.data.data;
  },
};
