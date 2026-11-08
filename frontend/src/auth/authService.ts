import api from "../api/client";
import type { ApiResponse, AuthResponse, User } from "../types/auth";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

export const authService = {
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );

    const auth = response.data.data;
    localStorage.setItem("token", auth.token);
    localStorage.setItem("user", JSON.stringify(auth.user));
    return auth;
  },

  async register(details: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      details
    );

    const auth = response.data.data;
    localStorage.setItem("token", auth.token);
    localStorage.setItem("user", JSON.stringify(auth.user));
    return auth;
  },

  async updateProfile(details: ProfileData): Promise<User> {
    const response = await api.put<ApiResponse<{ user: User }>>(
      "/auth/me",
      details
    );

    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const updatedUser: User = {
      ...currentUser,
      ...response.data.data.user,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  },

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser(): User | null {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem("token"));
  },
};
