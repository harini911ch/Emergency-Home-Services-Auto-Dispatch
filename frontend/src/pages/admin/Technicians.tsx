import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, RefreshCw, Users, UserCheck,
  UserX, Loader2, X
} from "lucide-react";
import { adminService, type AdminTechnician } from "../../api/adminService";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  skills: "plumbing",
  lat: "",
  lng: "",
  serviceRadiusKm: "15",
};

const Technicians = () => {
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      setTechnicians(await adminService.getTechnicians());
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load technicians.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createTechnician = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    const radius = Number(form.serviceRadiusKm);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError("Enter valid latitude and longitude coordinates.");
      return;
    }

    if (!Number.isFinite(radius) || radius < 1 || radius > 100) {
      setError("Service radius must be between 1 and 100 km.");
      return;
    }

    setSaving(true);
    try {
      await adminService.createTechnician({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        location: { lat, lng },
        serviceRadiusKm: radius,
      });
      setMessage("Technician account created successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadTechnicians();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to create technician.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (technician: AdminTechnician) => {
    const id = technician._id;
    const currentlyActive = technician.userId?.isActive !== false;
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await adminService.updateTechnicianStatus(id, !currentlyActive);
      setMessage(`Technician ${!currentlyActive ? "activated" : "deactivated"} successfully.`);
      await loadTechnicians();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to update technician status.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <Link to="/admin" className="back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <span className="eyebrow">WORKFORCE MANAGEMENT</span>
          <h1>Technicians</h1>
          <p>Manage technician accounts, service skills, and activation.</p>
        </div>
        <div className="page-actions">
          <button className="outline-button" onClick={loadTechnicians} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="primary-button" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Close form" : "Add technician"}
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {showForm && (
        <form className="form-card technician-form" onSubmit={createTechnician}>
          <div className="section-heading">
            <div><h2>Register a technician</h2><p>Create a technician login and service profile.</p></div>
          </div>

          <div className="form-grid">
            <div><label>Full name</label><input value={form.name} onChange={(e) => updateField("name", e.target.value)} minLength={2} maxLength={80} required placeholder="Technician name" /></div>
            <div><label>Email address</label><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required placeholder="technician@example.com" /></div>
            <div><label>Phone number</label><input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} minLength={10} maxLength={15} required placeholder="Phone number" /></div>
            <div><label>Temporary password</label><input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} minLength={8} maxLength={72} required placeholder="At least 8 characters" /></div>
            <div className="form-grid-full"><label>Service skills</label><input value={form.skills} onChange={(e) => updateField("skills", e.target.value)} required placeholder="plumbing, electrical, ac repair" /><small className="field-hint">Separate multiple skills with commas.</small></div>
            <div><label>Latitude</label><input type="number" step="any" value={form.lat} onChange={(e) => updateField("lat", e.target.value)} required placeholder="Technician latitude" /></div>
            <div><label>Longitude</label><input type="number" step="any" value={form.lng} onChange={(e) => updateField("lng", e.target.value)} required placeholder="Technician longitude" /></div>
            <div><label>Service radius (km)</label><input type="number" min="1" max="100" value={form.serviceRadiusKm} onChange={(e) => updateField("serviceRadiusKm", e.target.value)} required /></div>
          </div>

          <div className="form-actions">
            <button type="button" className="outline-button" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}
              {saving ? "Creating..." : "Create technician"}
            </button>
          </div>
        </form>
      )}

      <div className="results-count">
        <strong>{technicians.length}</strong> registered technicians
      </div>

      {loading ? (
        <div className="empty-state">Loading technicians...</div>
      ) : technicians.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={28} /></div>
          <h3>No technicians registered</h3>
          <p>Add technicians to make them available for automatic dispatch.</p>
        </div>
      ) : (
        <div className="technician-grid">
          {technicians.map((technician) => {
            const user = technician.userId;
            const active = user?.isActive !== false;
            return (
              <article className="technician-card" key={technician._id}>
                <div className="technician-card-top">
                  <div className="technician-avatar">{user?.name?.charAt(0)?.toUpperCase() || "T"}</div>
                  <span className={`status-pill ${active ? "status-completed" : "status-cancelled"}`}>
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3>{user?.name || "Technician"}</h3>
                <p>{user?.email || "—"}</p>
                <p>{user?.phone || "Phone not available"}</p>
                <div className="technician-skills">
                  {(technician.skills || []).map((skill) => <span key={skill}>{skill}</span>)}
                </div>
                <div className="technician-meta">
                  <span>{technician.isOnline ? "Online" : "Offline"}</span>
                  <span>{technician.serviceRadiusKm || 15} km service radius</span>
                </div>
                <button
                  className={active ? "danger-button technician-toggle" : "primary-button technician-toggle"}
                  onClick={() => toggleStatus(technician)}
                  disabled={busyId === technician._id}
                >
                  {busyId === technician._id ? <Loader2 className="spin" size={16} /> :
                    active ? <UserX size={16} /> : <UserCheck size={16} />}
                  {active ? "Deactivate account" : "Activate account"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Technicians;
