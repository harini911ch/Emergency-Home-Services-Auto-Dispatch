import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, XCircle, Play, RefreshCw,
  MapPin, Wrench, Loader2
} from "lucide-react";
import { technicianService } from "../../api/technicianService";
import type { EmergencyRequest } from "../../api/requestService";

const MyAssignments = () => {
  const [jobs, setJobs] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setJobs(await technicianService.getAssigned());
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const performAction = async (
    id: string,
    action: "ACCEPT" | "REJECT" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      if (action === "ACCEPT" || action === "REJECT") {
        await technicianService.respond(id, action);
      } else {
        await technicianService.updateStatus(id, action);
      }
      setMessage(
        action === "ACCEPT" ? "Assignment accepted successfully." :
        action === "REJECT" ? "Assignment rejected." :
        action === "IN_PROGRESS" ? "Work started successfully." :
        "Service marked as completed."
      );
      await loadJobs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setBusyId("");
    }
  };

  const label = (status: string) =>
    status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <Link to="/technician" className="back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <span className="eyebrow">JOB MANAGEMENT</span>
          <h1>My assignments</h1>
          <p>Accept jobs, update service progress, and complete customer requests.</p>
        </div>
        <button className="outline-button" onClick={loadJobs} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {loading ? (
        <div className="empty-state">Loading your assignments...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Wrench size={28} /></div>
          <h3>No assignments available</h3>
          <p>New jobs assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="assignment-list">
          {jobs.map((job) => (
            <article className="assignment-card" key={job._id}>
              <div className="assignment-card-header">
                <div className="request-card-icon"><Wrench size={21} /></div>
                <div className="request-info">
                  <h3>{job.category}</h3>
                  <small>Request ID: {job._id}</small>
                </div>
                <span className={`status-pill status-${job.status.toLowerCase()}`}>
                  {label(job.status)}
                </span>
              </div>

              <p className="request-description">{job.description}</p>
              <div className="request-meta"><MapPin size={16} /> {job.address}</div>
              <div className="request-meta"><strong>Priority:</strong> {job.priority}</div>
              {job.createdAt && (
                <div className="request-meta">
                  <strong>Requested:</strong> {new Date(job.createdAt).toLocaleString()}
                </div>
              )}

              <div className="assignment-actions">
                {job.status === "ASSIGNED" && (
                  <>
                    <button className="primary-button" disabled={busyId === job._id}
                      onClick={() => performAction(job._id, "ACCEPT")}>
                      {busyId === job._id ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
                      Accept job
                    </button>
                    <button className="danger-button" disabled={busyId === job._id}
                      onClick={() => performAction(job._id, "REJECT")}>
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}

                {job.status === "ON_THE_WAY" && (
                  <button className="primary-button" disabled={busyId === job._id}
                    onClick={() => performAction(job._id, "IN_PROGRESS")}>
                    <Play size={16} /> Start work
                  </button>
                )}

                {job.status === "IN_PROGRESS" && (
                  <button className="primary-button complete-button" disabled={busyId === job._id}
                    onClick={() => performAction(job._id, "COMPLETED")}>
                    <CheckCircle2 size={16} /> Mark completed
                  </button>
                )}

                {["COMPLETED", "CANCELLED"].includes(job.status) && (
                  <span className="field-hint">This assignment is closed.</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAssignments;
