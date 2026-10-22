import { useEffect, useState } from "react";
import { Bell, ChevronDown, Plus, Search } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MetricCard from "./components/MetricCard";
import ClientList from "./components/ClientList";
import Pipeline from "./components/Pipeline";
import { api } from "./lib/api";
import "./styles/app.css";
type Analytics = {
  activeClients: number;
  openDeals: number;
  pipelineValue: string;
  wonRevenue: string;
  stages: any[];
  upcomingActivities: any[];
};
export default function App() {
  const [page, setPage] = useState("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const load = async () => {
    try {
      const me = await api("/auth/me");
      if (!me.data) throw new Error("login");
      const [a, c, d, acts] = await Promise.all([
        api("/analytics"),
        api("/clients"),
        api("/deals"),
        api("/activities"),
      ]);
      setAnalytics(a.data);
      setClients(c.data);
      setDeals(d.data);
      setActivities(acts.data);
    } catch {
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  if (loading) return <div className="loading">Loading workspace…</div>;
  if (!loggedIn)
    return (
      <Login
        onLogin={() => {
          setLoggedIn(true);
          load();
        }}
      />
    );
  const updateStage = async (id: string, stage: string) => {
    await api(`/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    load();
  };
  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        onLogout={async () => {
          await api("/auth/logout", { method: "POST" });
          setLoggedIn(false);
        }}
      />
      <main>
        <header className="topbar">
          <div>
            <p className="crumb">MONDAY, OCTOBER 21, 2024</p>
            <h1>
              {page === "overview"
                ? "Good morning, Jordan"
                : page[0].toUpperCase() + page.slice(1)}
            </h1>
          </div>
          <div className="top-actions">
            <label className="global-search">
              <Search size={15} />
              <input placeholder="Search anything..." />
            </label>
            <button className="icon">
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">JD</div>
          </div>
        </header>
        <div className="content">
          {page === "overview" && analytics && (
            <>
              <div className="welcome">
                <div>
                  <p className="eyebrow">YOUR BUSINESS AT A GLANCE</p>
                  <h2>Overview</h2>
                  <p>
                    Keep track of your relationships and revenue in one place.
                  </p>
                </div>
                <button className="date-button">
                  Last 30 days <ChevronDown size={15} />
                </button>
              </div>
              <div className="metrics">
                <MetricCard
                  label="Active clients"
                  value={analytics.activeClients}
                  detail="12% vs last month"
                  tone="purple"
                />
                <MetricCard
                  label="Open deals"
                  value={analytics.openDeals}
                  detail="Across 4 active stages"
                  tone="blue"
                />
                <MetricCard
                  label="Pipeline value"
                  value={`$${Number(analytics.pipelineValue).toLocaleString()}`}
                  detail="Potential revenue"
                  tone="orange"
                />
                <MetricCard
                  label="Won revenue"
                  value={`$${Number(analytics.wonRevenue).toLocaleString()}`}
                  detail="This period"
                  tone="green"
                />
              </div>
              <Pipeline deals={deals} onStage={updateStage} />
              <div className="bottom-grid">
                <ClientList
                  clients={clients.slice(0, 5)}
                  onCreate={() => setPage("clients")}
                />
                <section className="card activity-card">
                  <div className="card-head">
                    <div>
                      <h2>Upcoming activities</h2>
                      <p>Stay on top of your follow-ups</p>
                    </div>
                    <button className="text-button">View all →</button>
                  </div>
                  {activities.slice(0, 5).map((activity) => (
                    <div className="activity" key={activity.id}>
                      <span className="activity-icon">
                        {activity.type[0].toUpperCase()}
                      </span>
                      <div>
                        <strong>{activity.title}</strong>
                        <small>
                          {activity.client_name || "General"} ·{" "}
                          {new Date(activity.due_at).toLocaleDateString()}
                        </small>
                      </div>
                      <span className="activity-type">{activity.type}</span>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
          {page === "clients" && (
            <ClientList clients={clients} onCreate={() => {}} />
          )}
          {page === "pipeline" && (
            <Pipeline deals={deals} onStage={updateStage} />
          )}{" "}
          {page === "activities" && (
            <section className="card page-card">
              <div className="card-head">
                <div>
                  <h2>Activities</h2>
                  <p>Calls, meetings, emails, and follow-ups</p>
                </div>
                <button className="primary">
                  <Plus size={15} /> Add activity
                </button>
              </div>
              {activities.map((a) => (
                <div className="activity" key={a.id}>
                  <span className="activity-icon">
                    {a.type[0].toUpperCase()}
                  </span>
                  <div>
                    <strong>{a.title}</strong>
                    <small>
                      {a.client_name || "General"} ·{" "}
                      {new Date(a.due_at).toLocaleString()}
                    </small>
                  </div>
                  <span className="activity-type">
                    {a.completed ? "Completed" : a.type}
                  </span>
                </div>
              ))}
            </section>
          )}
          {page === "reports" && (
            <section className="card page-card">
              <div className="card-head">
                <div>
                  <h2>Reports</h2>
                  <p>Analytics calculated from your live workspace data.</p>
                </div>
              </div>
              <div className="report-grid">
                {analytics?.stages.map((s) => (
                  <div className="report-stat" key={s.stage}>
                    <small>{s.stage}</small>
                    <strong>{s.count}</strong>
                    <span>${Number(s.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("demo@clientflow.local");
  const [password, setPassword] = useState("demo-password");
  const [error, setError] = useState("");
  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <span>CF</span>Client<span>Flow</span>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to your workspace.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
              });
              onLogin();
            } catch (err: any) {
              setError(err.message);
            }
          }}
        >
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <small className="form-error">{error}</small>}
          <button className="primary">Sign in</button>
        </form>
        <small>Demo: demo@clientflow.local / demo-password</small>
      </div>
    </div>
  );
}
