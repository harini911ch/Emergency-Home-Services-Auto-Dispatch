import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Wrench, MapPin, XCircle, Navigation, Image as ImageIcon } from "lucide-react";
import { requestService, type EmergencyRequest } from "../../api/requestService";

const MyRequests = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState("");

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setRequests(await requestService.getMine());
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load your requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const hasActiveRequests = requests.some((request) =>
    ["PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "UNASSIGNED"].includes(request.status)
  );

  useEffect(() => {
    if (!hasActiveRequests) return;

    const interval = window.setInterval(() => {
      loadRequests(true);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [hasActiveRequests, loadRequests]);

  const cancelRequest = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this service request?")) return;
    setCancelling(id);
    try {
      await requestService.cancel(id);
      await loadRequests(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to cancel this request.");
    } finally {
      setCancelling("");
    }
  };

  const statusLabel = (status: string) =>
    status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const canCancel = (status: string) =>
    ["PENDING", "ASSIGNED", "UNASSIGNED"].includes(status);

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <Link to="/customer" className="back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <span className="eyebrow">SERVICE HISTORY</span>
          <h1>My requests</h1>
          <p>Track your bookings and technician assignments.</p>
        </div>
        <button className="outline-button" onClick={() => loadRequests()} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {hasActiveRequests && (
        <div className="location-note">
          <RefreshCw size={14} /> Active requests refresh automatically every 10 seconds.
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading your service requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Wrench size={28} /></div>
          <h3>No requests found</h3>
          <p>Your service bookings will appear here.</p>
          <Link to="/customer/book" className="primary-button">Book a service</Link>
        </div>
      ) : (
        <div className="request-list">
          {requests.map((request) => (
            <article className="request-detail-card" key={request._id}>
              <div className="request-detail-top">
                <div className="request-card-icon"><Wrench size={21} /></div>
                <div className="request-info">
                  <h3>{request.category}</h3>
                  <small>Request ID: {request._id}</small>
                </div>
                <span className={`status-pill status-${request.status.toLowerCase()}`}>
                  {statusLabel(request.status)}
                </span>
              </div>

              <p className="request-description">{request.description}</p>

              {request.photoData && (
                <div className="request-photo-section">
                  <div className="request-meta"><ImageIcon size={15} /> Issue photo</div>
                  <a href={request.photoData} target="_blank" rel="noreferrer">
                    <img
                      src={request.photoData}
                      alt="Uploaded issue"
                      className="request-photo-preview"
                    />
                  </a>
                </div>
              )}

              <div className="request-meta"><MapPin size={16} /> {request.address}</div>
              <div className="request-meta">
                <strong>Priority:</strong> {request.priority}
              </div>
              {request.createdAt && (
                <div className="request-meta">
                  <strong>Booked:</strong> {new Date(request.createdAt).toLocaleString()}
                </div>
              )}

              {request.assignedTechnician?.userId?.name && (
                <div className="technician-assigned">
                  <strong>Assigned technician</strong>
                  <span>{request.assignedTechnician.userId.name}</span>
                  {request.assignedTechnician.userId.phone && (
                    <span>{request.assignedTechnician.userId.phone}</span>
                  )}

                  {request.assignedTechnician.location?.lat != null &&
                    request.assignedTechnician.location?.lng != null && (
                      <a
                        className="technician-location-link"
                        href={`https://www.openstreetmap.org/?mlat=${request.assignedTechnician.location.lat}&mlon=${request.assignedTechnician.location.lng}#map=16/${request.assignedTechnician.location.lat}/${request.assignedTechnician.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Navigation size={15} /> View technician location
                      </a>
                    )}
                </div>
              )}

              {canCancel(request.status) && (
                <div className="request-actions">
                  <button className="danger-button" onClick={() => cancelRequest(request._id)}
                    disabled={cancelling === request._id}>
                    <XCircle size={16} />
                    {cancelling === request._id ? "Cancelling..." : "Cancel request"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;