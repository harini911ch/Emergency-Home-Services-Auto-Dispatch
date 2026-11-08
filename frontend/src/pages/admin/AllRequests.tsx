import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, RefreshCw, ClipboardList } from "lucide-react";
import { adminService } from "../../api/adminService";
import type { EmergencyRequest } from "../../api/requestService";

const AllRequests = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await adminService.getAllRequests());
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load service requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filtered = requests.filter((r) => {
    const matchesStatus = filter === "ALL" || r.status === filter;
    const term = search.toLowerCase();
    const matchesSearch =
      r.category.toLowerCase().includes(term) ||
      r.address.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term) ||
      r._id.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const label = (status: string) =>
    status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <Link to="/admin" className="back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <span className="eyebrow">OPERATIONS MANAGEMENT</span>
          <h1>All service requests</h1>
          <p>Monitor customer bookings and automatic technician dispatch.</p>
        </div>
        <button className="outline-button" onClick={loadRequests} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <section className="filter-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category, address or request ID..." />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ON_THE_WAY">On the way</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="UNASSIGNED">Unassigned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </section>

      <div className="results-count">
        Showing <strong>{filtered.length}</strong> of {requests.length} requests
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><ClipboardList size={28} /></div>
          <h3>No matching requests</h3>
          <p>Try changing your search or status filter.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Address</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>
                    <strong>{r.category}</strong>
                    <small className="table-subtext">{r._id}</small>
                  </td>
                  <td className="address-cell">{r.address}</td>
                  <td><span className={`priority-text priority-${r.priority.toLowerCase()}`}>{r.priority}</span></td>
                  <td><span className={`status-pill status-${r.status.toLowerCase()}`}>{label(r.status)}</span></td>
                  <td>{r.assignedTechnician?.userId?.name || "Not assigned"}</td>
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllRequests;
