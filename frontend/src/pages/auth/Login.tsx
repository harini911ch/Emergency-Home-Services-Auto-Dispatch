import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, ArrowRight, ShieldCheck, Clock, MapPin } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { getDashboardPath } from "../../auth/ProtectedRoute";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(email.trim(), password);
      navigate(getDashboardPath(loggedInUser.role), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to sign in. Please check your credentials.");
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
          <span className="eyebrow"><span className="live-dot" /> HELP WHEN IT MATTERS</span>
          <h1>Home emergencies?<br /><span>We've got you.</span></h1>
          <p>Connect with trusted service professionals. Get the right help, right when you need it.</p>

          <div className="visual-features">
            <div><span><Clock size={19} /></span><p><strong>Quick response</strong><small>Get connected without the wait.</small></p></div>
            <div><span><ShieldCheck size={19} /></span><p><strong>Trusted professionals</strong><small>Skilled technicians for your needs.</small></p></div>
            <div><span><MapPin size={19} /></span><p><strong>Location-based dispatch</strong><small>Find available help near you.</small></p></div>
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

          <span className="form-eyebrow">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="form-description">Enter your details to continue to SwiftServe.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="primary-button auth-submit" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">Don't have an account? <Link to="/register">Create an account</Link></p>
          <div className="secure-note"><ShieldCheck size={16} /> Your account and information are secure.</div>
        </div>
      </section>
    </div>
  );
}
