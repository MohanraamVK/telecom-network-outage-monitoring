import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { TextField } from "../components/ui/Field";
import { useAuth } from "../hooks/useAuth";
import { errorMessage } from "../services/errors";

// Only show the seeded demo login in development, or when explicitly enabled
// (e.g. for a public portfolio demo) via VITE_SHOW_DEMO_CREDENTIALS=true.
const SHOW_DEMO_CREDENTIALS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === "true";
const DEMO_USERNAME = import.meta.env.VITE_DEMO_USERNAME || "admin";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "admin123";
const DEMO_IS_READ_ONLY = Boolean(import.meta.env.VITE_DEMO_USERNAME);

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const message = sessionStorage.getItem("auth_message");
    if (message) {
      setError(message);
      sessionStorage.removeItem("auth_message");
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const set = (field) => (event) => {
    setError("");
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError("Enter your username and password.");
      return;
    }
    try {
      setLoading(true);
      await login(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Login failed. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-fjord-800 bg-fjord-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <SignalField />
        <div className="relative flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-signal" />
          <span className="font-display text-lg font-semibold">Outage Monitor</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-4xl leading-tight font-semibold tracking-tight">
            Know which tower went quiet before the first customer calls.
          </p>
          <p className="mt-4 text-fjord-300">
            Live heartbeats from every node, automatic outage detection and a full timeline for each incident.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-1 text-fjord-400">to the network operations console</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {error ? (
              <p role="alert" className="rounded-md border border-outage/30 bg-outage/10 px-3 py-2 text-sm text-outage">
                {error}
              </p>
            ) : null}
            <TextField label="Username" name="username" autoComplete="username" value={form.username} onChange={set("username")} />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={set("password")}
            />
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          {SHOW_DEMO_CREDENTIALS ? (
            <div className="mt-8 rounded-md border border-fjord-800 bg-fjord-900 p-4 text-sm">
              <p className="font-semibold text-fjord-100">
                {DEMO_IS_READ_ONLY ? "Try the read-only demo" : "Seeded admin account"}
              </p>
              <p className="mt-1 text-fjord-400">
                {DEMO_USERNAME} / {DEMO_PASSWORD}
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => {
                  setError("");
                  setForm({ username: DEMO_USERNAME, password: DEMO_PASSWORD });
                }}
              >
                Fill in demo login
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

/** Decorative map of node sites with radiating signal rings. */
function SignalField() {
  const sites = [
    [62, 70], [70, 58], [58, 48], [76, 38], [48, 30], [66, 22], [40, 62], [82, 80],
  ];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {sites.map(([x, y], i) =>
        sites.slice(i + 1, i + 3).map(([x2, y2]) => (
          <line key={`${i}-${x2}`} x1={x} y1={y} x2={x2} y2={y2} className="stroke-fjord-700" strokeWidth="0.15" />
        ))
      )}
      {sites.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.5" className={i === 3 ? "fill-outage/10 stroke-outage/40" : "fill-signal/5 stroke-signal/25"} strokeWidth="0.15" />
          <circle cx={x} cy={y} r="0.8" className={i === 3 ? "fill-outage" : "fill-signal"} />
        </g>
      ))}
    </svg>
  );
}

export default LoginPage;
