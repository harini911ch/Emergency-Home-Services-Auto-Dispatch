import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness, CheckCircle2, Clock3, Power,
  RefreshCw, Wrench, ArrowRight, MapPin
} from "lucide-react";
import { technicianService } from "../../api/technicianService";
import type { EmergencyRequest } from "../../api/requestService";

const TechnicianDashboard = () => {
  const [jobs, setJobs] = useState<EmergencyRequest[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [assignedJobs, profile, history] = await Promise.all([
        technicianService.getAssigned(),
        technicianService.getProfile(),
        technicianService.getHistory(),
      ]);

      setJobs(assignedJobs);
      setAvailable(profile.isOnline);
      setCompletedCount(history.length);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load technician dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const toggleAvailability = async () => {
    setUpdating(true);
    setError("");

    try {
      await technicianService.updateAvailability(!available);
      setAvailable(!available);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to update availability.");
    } finally {
      setUpdating(false);
    }
  };

  const updateMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser.");
      return;
    }

    setLocationUpdating(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await technicianService.updateLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          setLocationMessage("Your location was updated successfully.");
        } catch (err: any) {
          setLocationMessage(
            err.response?.data?.message || "Unable to save your location."
          );
        } finally {
          setLocationUpdating(false);
        }
      },
      (geoError) => {
        setLocationUpdating(false);
        setLocationMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access in your browser."
            : "Unable to get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const pending = jobs.filter((job) => job.status === "ASSIGNED").length;
  const active = jobs.filter((job) =>
    ["ON_THE_WAY", "IN_PROGRESS"].includes(job.status)
  ).length;

  return (
    <div className="page-content">
      <section className="technician-welcome">
        <div>
          <span className="eyebrow">TECHNICIAN WORKSPACE</span>
          <h1>Welcome back!</h1>
          <p>Manage your service assignments and help customers.</p>
        </div>

        <div className={`availability-control ${available ? "is-online" : "is-offline"}`}>
          <div>
            <span className="availability-dot" />
            <strong>{available ? "Available" : "Unavailable"}</strong>
          </div>
          <button onClick={toggleAvailability} disabled={updating || loading}>
            <Power size={16} />
            {updating ? "Updating..." : available ? "Go offline" : "Go online"}
          </button>
        </div>
      </section>

      {error && <div className="form-error">{error}</div>}

      <section className="technician-summary">
        <div>
          <strong><MapPin size={18} /> Location sharing</strong>
          <span>Update your GPS location so customers and dispatch can find you.</span>
          {locationMessage && <small>{locationMessage}</small>}
        </div>
        <button
          className="outline-button"
          onClick={updateMyLocation}
          disabled={locationUpdating}
        >
          <MapPin size={16} />
          {locationUpdating ? "Updating..." : "Update my location"}
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon blue"><BriefcaseBusiness /></div>
          <div><span>Assigned jobs</span><strong>{jobs.length}</strong></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon orange"><Clock3 /></div>
          <div><span>Pending acceptance</span><strong>{pending}</strong></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green"><CheckCircle2 /></div>
          <div><span>Completed jobs</span><strong>{completedCount}</strong></div>
        </article>
      </section>

      <section className="section-heading">
        <div>
          <h2>Current assignments</h2>
          <p>Review and update your assigned service jobs.</p>
        </div>
        <button className="outline-button" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      {loading ? (
        <div className="empty-state">Loading technician dashboard...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Wrench size={28} /></div>
          <h3>No active assignments</h3>
          <p>New service requests will appear here when assigned to you.</p>
        </div>
      ) : (
        <div className="request-list">
          {jobs.map((job) => (
            <article className="request-card" key={job._id}>
              <div className="request-card-icon"><Wrench size={21} /></div>
              <div className="request-info">
                <h3>{job.category}</h3>
                <p>{job.address}</p>
                <small>Priority: {job.priority}</small>
              </div>
              <span className={`status-pill status-${job.status.toLowerCase()}`}>
                {job.status.replaceAll("_", " ")}
              </span>
            </article>
          ))}
        </div>
      )}

      <section className="technician-summary">
        <div>
          <strong>{active}</strong>
          <span>Jobs currently in progress or on the way</span>
        </div>
        <Link to="/technician/assignments" className="text-link">
          Manage assignments <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
};

export default TechnicianDashboard;