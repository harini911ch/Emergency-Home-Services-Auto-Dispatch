import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, History, MapPin, Wrench } from "lucide-react";
import { technicianService } from "../../api/technicianService";
import type { EmergencyRequest } from "../../api/requestService";

export default function JobHistory() {
  const [jobs, setJobs] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    technicianService.getHistory()
      .then(setJobs)
      .catch((err: unknown) => {
        const message =
          typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(message || "Unable to load completed jobs.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <section className="section-heading">
        <div>
          <h2>Completed Job History</h2>
          <p>Review the service requests you have successfully completed.</p>
        </div>
      </section>

      {error && <div className="form-error">{error}</div>}

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon green"><CheckCircle2 /></div>
          <div><span>Completed jobs</span><strong>{loading ? "—" : jobs.length}</strong></div>
        </article>
      </section>

      {loading ? (
        <div className="empty-state">Loading completed jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><History size={28} /></div>
          <h3>No completed jobs yet</h3>
          <p>Your completed service assignments will appear here.</p>
        </div>
      ) : (
        <div className="request-list">
          {jobs.map((job) => (
            <article className="request-card" key={job._id}>
              <div className="request-card-icon"><Wrench size={21} /></div>
              <div className="request-info">
                <h3>{job.category}</h3>
                <p><MapPin size={14} style={{ verticalAlign: "middle" }} /> {job.address}</p>
                <small>
                  <Clock3 size={13} style={{ verticalAlign: "middle" }} /> Completed:{" "}
                  {job.completedAt ? new Date(job.completedAt).toLocaleString() : "Date unavailable"}
                </small>
                <p>{job.description}</p>
              </div>
              <span className="status-pill status-completed">Completed</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
