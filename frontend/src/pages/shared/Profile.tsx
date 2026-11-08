import { useEffect, useState, type FormEvent } from "react";
import { Save, UserRound } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    if (!/^\+?[0-9\s-]{10,16}$/.test(phone.trim())) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setMessage("Your profile has been updated successfully.");
    } catch (err: unknown) {
      const messageFromApi =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(messageFromApi || (err instanceof Error ? err.message : "Unable to update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <section className="section-heading">
        <div>
          <h2>My Profile</h2>
          <p>Manage your personal account information.</p>
        </div>
      </section>

      <section style={{
        maxWidth: 680,
        padding: 28,
        borderRadius: 18,
        background: "#ffffff",
        border: "1px solid #e3edf7",
        boxShadow: "0 8px 28px rgba(40, 90, 140, 0.07)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            display: "grid", placeItems: "center",
            background: "#eaf4ff", color: "#2476c7"
          }}>
            <UserRound size={27} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{user?.name}</h3>
            <p style={{ margin: "5px 0 0", color: "#718096" }}>
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>

        {message && <div role="status" style={{ padding: 12, marginBottom: 16, borderRadius: 9, background: "#e9f8ef", color: "#187344" }}>{message}</div>}
        {error && <div role="alert" className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: 600 }}>Full name</label>
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80}
            style={fieldStyle} />

          <label style={{ display: "block", margin: "18px 0 7px", fontWeight: 600 }}>Email address</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={150}
            style={fieldStyle} />

          <label style={{ display: "block", margin: "18px 0 7px", fontWeight: 600 }}>Phone number</label>
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required
            style={fieldStyle} />

          <button type="submit" className="primary-button" disabled={saving} style={{ marginTop: 24 }}>
            <Save size={17} /> {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid #d7e3ef",
  borderRadius: 9,
  background: "#fbfdff",
  color: "#26384a",
  fontSize: 15,
  outlineColor: "#4b9be8",
};
