import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { getDashboardPath } from "../../auth/ProtectedRoute";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^\d{10,15}$/.test(phone.trim())) {
      setError("Phone number must contain 10 to 15 digits.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const newUser = await register(
        name.trim(),
        email.trim(),
        phone.trim(),
        password
      );
      navigate(getDashboardPath(newUser.role), { replace: true });
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      const validationMessage = Array.isArray(validationErrors)
        ? validationErrors.map((item: { field?: string; message?: string }) =>
            `${item.field ? `${item.field}: ` : ""}${item.message ?? ""}`
          ).join(", ")
        : "";

      setError(
        validationMessage ||
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand">
          <div className="brand-icon"><Activity size={25} /></div>
          <div><strong>SwiftServe</strong><span>Emergency Home Services</span></div>
        </div>
        <div className="visual-content">
          <span className="eyebrow">YOUR HOME, OUR PRIORITY</span>
          <h1>Reliable help is<br /><span>one step away.</span></h1>
          <p>Create your account and get connected with professionals for your home service emergencies.</p>
          <div className="visual-highlight">
            <ShieldCheck size={24} />
            <div><strong>Simple. Reliable. Responsive.</strong><p>One place to request and track your home services.</p></div>
          </div>
        </div>
        <div className="visual-footer">Reliable help for every home.</div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand">
            <div className="brand-icon"><Activity size={23} /></div>
            <strong>SwiftServe</strong>
          </div>

          <span className="form-eyebrow">GET STARTED</span>
          <h2>Create your account</h2>
          <p className="form-description">Join SwiftServe to request trusted home services.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={150}
              required
            />

            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 15))}
              autoComplete="tel"
              inputMode="numeric"
              maxLength={15}
              required
            />

            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />

            {error && <div className="form-error">{error}</div>}

            <button className="primary-button auth-submit" type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          <div className="secure-note"><ShieldCheck size={16} /> Registration creates a customer account.</div>
        </div>
      </section>
    </div>
  );
}
