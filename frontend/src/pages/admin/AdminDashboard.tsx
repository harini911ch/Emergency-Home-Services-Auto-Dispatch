import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList, Users, Clock3, CheckCircle2,
  ArrowRight, RefreshCw, ShieldCheck, Wrench,
  UserCheck, UserX
} from "lucide-react";
import { adminService, type AdminTechnician } from "../../api/adminService";
import type { EmergencyRequest } from "../../api/requestService";

const AdminDashboard = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [requestData, technicianData] = await Promise.all([
        adminService.getAllRequests(),
        adminService.getTechnicians(),
      ]);
      setRequests(requestData);
      setTechnicians(technicianData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load admin statistics. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const active = requests.filter((r) =>
    ["PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "UNASSIGNED"].includes(r.status)
  ).length;

  const completed = requests.filter((r) => r.status === "COMPLETED").length;
  const cancelled = requests.filter((r) => r.status === "CANCELLED").length;
  const online = technicians.filter((t) => t.isOnline && t.isAvailable).length;
  const offline = technicians.length - online;

  const statuses = [
    { label: "Pending", value: requests.filter((r) => r.status === "PENDING").length },
    { label: "Assigned", value: requests.filter((r) => r.status === "ASSIGNED").length },
    { label: "On the way", value: requests.filter((r) => r.status === "ON_THE_WAY").length },
    { label: "In progress", value: requests.filter((r) => r.status === "IN_PROGRESS").length },
    { label: "Unassigned", value: requests.filter((r) => r.status === "UNASSIGNED").length },
    { label: "Completed", value: completed },
    { label: "Cancelled", value: cancelled },
  ];

  const categoryCounts = Object.entries(
    requests.reduce<Record<string, number>>((counts, request) => {
      const category = request.category || "Other";
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const maxCategoryCount = Math.max(1, ...categoryCounts.map(([, count]) => count));

  return (
    <div className="page-content">
      <section className="welcome-banner admin-welcome">
        <div>
          <span className="eyebrow">ADMIN CONTROL CENTER</span>
          <h1>Operations overview</h1>
          <p>Monitor service requests, technician availability, and dispatch activity.</p>
          <Link to="/admin/requests" className="primary-button">
            Manage requests <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-icon"><ShieldCheck size={76} /></div>
      </section>

      <div className="section-heading">
        <div>
          <h2>System statistics</h2>
          <p>Live overview from the service platform.</p>
        </div>
        <button className="outline-button" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon blue"><ClipboardList /></div>
          <div><span>Total requests</span><strong>{loading ? "—" : requests.length}</strong></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon orange"><Clock3 /></div>
          <div><span>Active requests</span><strong>{loading ? "—" : active}</strong></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green"><CheckCircle2 /></div>
          <div><span>Completed requests</span><strong>{loading ? "—" : completed}</strong></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon purple"><Users /></div>
          <div><span>Technicians</span><strong>{loading ? "—" : technicians.length}</strong></div>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="overview-card">
          <div className="overview-card-icon"><Users size={23} /></div>
          <h3>Technician management</h3>
          <p>View technicians, manage availability, and add service professionals.</p>
          <strong>{loading ? "—" : `${online} available online`}</strong>
          <div className="request-meta">
            <UserCheck size={15} /> {loading ? "—" : `${online} online`}
            <UserX size={15} /> {loading ? "—" : `${offline} offline or unavailable`}
          </div>
          <Link to="/admin/technicians" className="text-link">
            Manage technicians <ArrowRight size={16} />
          </Link>
        </article>

        <article className="overview-card">
          <div className="overview-card-icon"><ClipboardList size={23} /></div>
          <h3>Service requests</h3>
          <p>Review customer requests and monitor the automatic dispatch process.</p>
          <strong>{loading ? "—" : `${active} active requests`}</strong>
          <div className="request-meta">
            <CheckCircle2 size={15} /> {loading ? "—" : `${completed} completed`}
          </div>
          <Link to="/admin/requests" className="text-link">
            View all requests <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="overview-card">
          <div className="section-heading">
            <div>
              <h3><ClipboardList size={19} /> Request status breakdown</h3>
              <p>Current distribution of service requests.</p>
            </div>
          </div>

          {loading ? (
            <p>Loading statistics...</p>
          ) : requests.length === 0 ? (
            <p>No service requests available yet.</p>
          ) : (
            <div className="admin-breakdown-list">
              {statuses.map((item) => (
                <div className="admin-breakdown-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="overview-card">
          <div className="section-heading">
            <div>
              <h3><Wrench size={19} /> Requests by service</h3>
              <p>Most requested service categories.</p>
            </div>
          </div>

          {loading ? (
            <p>Loading categories...</p>
          ) : categoryCounts.length === 0 ? (
            <p>No category data available yet.</p>
          ) : (
            <div className="admin-breakdown-list">
              {categoryCounts.map(([category, count]) => (
                <div className="admin-category-row" key={category}>
                  <div className="admin-breakdown-row">
                    <span>{category}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="admin-category-track">
                    <div
                      className="admin-category-fill"
                      style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;