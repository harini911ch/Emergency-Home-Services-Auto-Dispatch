import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ClipboardList, Clock3, Plus, ShieldCheck,
  Wrench, CheckCircle2, AlertCircle
} from "lucide-react";
import { requestService, type EmergencyRequest } from "../../api/requestService";

const CustomerDashboard = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestService.getMine()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = requests.filter((r) =>
    ["PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS"].includes(r.status)
  ).length;

  const completedCount = requests.filter((r) => r.status === "COMPLETED").length;

  const statusLabel = (status: string) =>
    status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="page-content">
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">CUSTOMER PORTAL</span>
          <h1>Your comfort. Our priority.</h1>
          <p>Book trusted home services and track assistance in real time.</p>
          <Link to="/customer/book" className="primary-button">
            <Plus size={18} /> Book a service
          </Link>
        </div>
        <div className="welcome-icon"><ShieldCheck size={76} /></div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon blue"><ClipboardList /></div>
          <div><span>Total requests</span><strong>{loading ? "—" : requests.length}</strong></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon orange"><Clock3 /></div>
          <div><span>Active requests</span><strong>{loading ? "—" : activeCount}</strong></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green"><CheckCircle2 /></div>
          <div><span>Completed</span><strong>{loading ? "—" : completedCount}</strong></div>
        </article>
      </section>

      <section className="section-heading">
        <div><h2>Recent requests</h2><p>Keep track of your home service bookings.</p></div>
        <Link to="/customer/requests" className="text-link">View all <ArrowRight size={16} /></Link>
      </section>

      <section className="request-list">
        {loading ? (
          <div className="empty-state">Loading your requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Wrench size={28} /></div>
            <h3>No service requests yet</h3>
            <p>Need help at home? Book your first service in a few steps.</p>
            <Link to="/customer/book" className="primary-button">Book your first service <ArrowRight size={17} /></Link>
          </div>
        ) : (
          requests.slice(0, 4).map((request) => (
            <article className="request-card" key={request._id}>
              <div className="request-card-icon"><Wrench size={21} /></div>
              <div className="request-info">
                <h3>{request.category}</h3>
                <p>{request.address}</p>
                <small>{request.createdAt ? new Date(request.createdAt).toLocaleString() : "Recently created"}</small>
              </div>
              <span className={`status-pill status-${request.status.toLowerCase()}`}>
                {statusLabel(request.status)}
              </span>
            </article>
          ))
        )}
      </section>

      <div className="help-banner">
        <AlertCircle size={22} />
        <div><strong>Need urgent assistance?</strong><p>Create a request and our dispatch system will find an available technician.</p></div>
        <Link to="/customer/book">Get help <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
};

export default CustomerDashboard;
