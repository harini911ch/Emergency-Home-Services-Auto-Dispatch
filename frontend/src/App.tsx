import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import {
  ProtectedRoute,
  RoleRoute,
  getDashboardPath,
} from "./auth/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import BookService from "./pages/customer/BookService";
import MyRequests from "./pages/customer/MyRequests";

import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import MyAssignments from "./pages/technician/MyAssignments";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AllRequests from "./pages/admin/AllRequests";
import Technicians from "./pages/admin/Technicians";
import Profile from "./pages/shared/Profile";
import JobHistory from "./pages/technician/JobHistory";

import "./App.css";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? getDashboardPath(user.role) : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["CUSTOMER"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/customer" element={<CustomerDashboard />} />
            <Route path="/customer/book" element={<BookService />} />
            <Route path="/customer/requests" element={<MyRequests />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={["TECHNICIAN"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/technician" element={<TechnicianDashboard />} />
            <Route path="/technician/assignments" element={<MyAssignments />} />
            <Route path="/technician/history" element={<JobHistory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<AllRequests />} />
            <Route path="/admin/technicians" element={<Technicians />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
