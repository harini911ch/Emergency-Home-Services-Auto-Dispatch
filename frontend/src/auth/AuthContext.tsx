import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { authService } from "./authService";
import type { User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<User>;
  updateProfile: (details: {
    name: string;
    email: string;
    phone: string;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(
    () => authService.getCurrentUser()
  );
  const [loading] = useState(false);

  const login = async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    setUser(result.user);
    return result.user;
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => {
    const result = await authService.register({
      name,
      email,
      phone,
      password,
    });
    setUser(result.user);
    return result.user;
  };

  const updateProfile = async (details: {
    name: string;
    email: string;
    phone: string;
  }) => {
    const updatedUser = await authService.updateProfile(details);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
