import {
  Activity,
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  Wrench,
  ShieldCheck,
  UserRound,
  Bell,
  CheckCheck,
  Trash2,
  BellRing,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../auth/AuthContext";
import { getDashboardPath } from "../auth/ProtectedRoute";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "ASSIGNMENT" | "STATUS" | "INFO" | "WARNING";
  requestId?: string;
  createdAt: string;
  read: boolean;
}

const navigation = {
  CUSTOMER: [
    { label: "Overview", path: "/customer", icon: LayoutDashboard },
    { label: "Book a Service", path: "/customer/book", icon: Wrench },
    { label: "My Requests", path: "/customer/requests", icon: ClipboardList },
    { label: "My Profile", path: "/profile", icon: UserRound },
  ],
  TECHNICIAN: [
    { label: "Overview", path: "/technician", icon: LayoutDashboard },
    { label: "My Assignments", path: "/technician/assignments", icon: ClipboardList },
    { label: "Job History", path: "/technician/history", icon: Activity },
    { label: "My Profile", path: "/profile", icon: UserRound },
  ],
  ADMIN: [
    { label: "Overview", path: "/admin", icon: LayoutDashboard },
    { label: "All Requests", path: "/admin/requests", icon: ClipboardList },
    { label: "Technicians", path: "/admin/technicians", icon: Users },
    { label: "My Profile", path: "/profile", icon: UserRound },
  ],
};

const getNotificationStorageKey = (email: string) =>
  `swiftserve_notifications_${email}`;

const getNotificationDestination = (role: string) => {
  if (role === "TECHNICIAN") return "/technician/assignments";
  if (role === "ADMIN") return "/admin/requests";
  return "/customer/requests";
};

const formatNotificationTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(date);
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const notificationKey = user
    ? getNotificationStorageKey(user.email)
    : "";

  useEffect(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(notificationKey);
      const parsed = stored ? JSON.parse(stored) : [];

      if (Array.isArray(parsed)) {
        setNotifications(parsed);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }

    const token = localStorage.getItem("token");

    if (!token) return;

    const apiUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const socketUrl = apiUrl.replace(/\/api\/?$/, "");

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("notification:new", (incoming: Omit<NotificationItem, "read">) => {
      const notification: NotificationItem = {
        ...incoming,
        read: false,
      };

      setNotifications((previous) => {
        if (previous.some((item) => item.id === notification.id)) {
          return previous;
        }

        return [notification, ...previous].slice(0, 50);
      });
    });

    socket.on("connect_error", (error) => {
      console.error("Notification connection error:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, notificationKey]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(
      notificationKey,
      JSON.stringify(notifications)
    );
  }, [notifications, notificationKey, user]);

  if (!user) return null;

  const links = navigation[user.role] ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel =
    user.role.charAt(0) + user.role.slice(1).toLowerCase();

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, read: true }))
    );
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      )
    );
  };

  const openNotification = (notification: NotificationItem) => {
    markAsRead(notification.id);
    setNotificationsOpen(false);
    navigate(getNotificationDestination(user.role));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={23} />
          </div>
          <div>
            <strong>SwiftServe</strong>
            <span>Emergency Services</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {links.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === getDashboardPath(user.role)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon">
              <ShieldCheck size={19} />
            </div>
            <strong>Service you can trust</strong>
            <p>Reliable help, whenever you need it.</p>
          </div>

          <button className="nav-link logout-link" onClick={handleLogout}>
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="topbar-context">
            <span>Emergency Home Services</span>
            <small>Fast help. Trusted professionals.</small>
          </div>

          <div className="topbar-actions">
            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                          : "You're all caught up"}
                      </span>
                    </div>
                    <button
                      className="notification-close icon-button"
                      aria-label="Close notifications"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {notifications.length > 0 ? (
                    <>
                      <div className="notification-toolbar">
                        <button
                          onClick={markAllAsRead}
                          disabled={unreadCount === 0}
                        >
                          <CheckCheck size={15} />
                          Mark all read
                        </button>
                        <button onClick={clearNotifications}>
                          <Trash2 size={15} />
                          Clear all
                        </button>
                      </div>

                      <div className="notification-list">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            className={`notification-item ${notification.read ? "notification-read" : "notification-unread"}`}
                            onClick={() => openNotification(notification)}
                          >
                            <span
                              className={`notification-type-icon notification-type-${notification.type.toLowerCase()}`}
                            >
                              {notification.type === "WARNING" ? (
                                <BellRing size={17} />
                              ) : (
                                <Bell size={17} />
                              )}
                            </span>

                            <span className="notification-content">
                              <strong>{notification.title}</strong>
                              <span>{notification.message}</span>
                              <small>
                                {formatNotificationTime(notification.createdAt)}
                              </small>
                            </span>

                            {!notification.read && (
                              <span className="notification-unread-dot" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="notification-empty">
                      <div className="notification-empty-icon">
                        <Bell size={23} />
                      </div>
                      <strong>No notifications yet</strong>
                      <span>
                        Updates about your service activity will appear here.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="profile-chip">
              <div className="avatar">
                <UserRound size={19} />
              </div>
              <div className="profile-info">
                <strong>{user.name}</strong>
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} SwiftServe</span>
          <span>Emergency assistance, made simpler.</span>
        </footer>
      </main>
    </div>
  );
}
