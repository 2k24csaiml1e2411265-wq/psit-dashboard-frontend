import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line
} from "recharts";

// ─────────────────────────────────────────────────────────────
// IMPORTANT: After you deploy the backend on Render,
// replace this URL with your actual Render URL
// ─────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || "https://psit-dashboard-backend.onrender.com";

// Colours for each department
const DEPT_COLOR = {
  CSE: "#0891B2", ECE: "#6C3FC5", ME: "#E07020",
  CE:  "#1B4D3E", MBA: "#F4A017", MCA: "#2ECC71", EEE: "#E74C3C",
};

// Score colour: green = good, orange = ok, red = bad
const scoreColor = (s) => s >= 70 ? "#2ECC71" : s >= 50 ? "#F4A017" : "#E74C3C";

// ─── Small reusable components ───────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: "#131F2E", borderRadius: 14, padding: 20, ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, color = "#94A3B8" }) {
  return (
    <p style={{
      margin: "0 0 14px", fontSize: 12, fontWeight: 700,
      color, letterSpacing: "0.08em", textTransform: "uppercase"
    }}>
      {children}
    </p>
  );
}

function StatBox({ icon, value, label, color }) {
  return (
    <Card style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>{label}</div>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0D1B2A", border: "1px solid #1C2E3F",
      borderRadius: 8, padding: "10px 14px", fontSize: 12
    }}>
      <p style={{ margin: "0 0 6px", color: "#94A3B8" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ margin: "2px 0", color: p.color }}>
          {p.name}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
}

// ─── Loading screen ──────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      background: "#0D1B2A", minHeight: "100vh", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
      <div style={{ fontSize: 18, color: "#2ECC71", fontWeight: 700 }}>
        Smart Campus Dashboard
      </div>
      <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>
        Connecting to PSIT sensors…
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────

export default function App() {
  const [scores,  setScores]  = useState([]);
  const [energy,  setEnergy]  = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [summary, setSummary] = useState({});
  const [trend,   setTrend]   = useState([]);
  const [dept,    setDept]    = useState("CSE");
  const [lastSync,setLastSync]= useState(null);
  const [loading, setLoading] = useState(true);
  const [tick,    setTick]    = useState(0);

  // Fetch all dashboard data
  const fetchAll = useCallback(async () => {
    try {
      const [sc, en, al, su] = await Promise.all([
        fetch(`${API}/scores`).then(r => r.json()),
        fetch(`${API}/energy/latest`).then(r => r.json()),
        fetch(`${API}/anomalies`).then(r => r.json()),
        fetch(`${API}/summary`).then(r => r.json()),
      ]);
      setScores(sc);
      setEnergy(en);
      setAlerts(al);
      setSummary(su);
      setLastSync(new Date());
      setTick(t => t + 1);
      setLoading(false);
    } catch (e) {
      console.error("API error:", e);
    }
  }, []);

  // Fetch trend chart for selected department
  const fetchTrend = useCallback(async (d) => {
    try {
      const data = await fetch(`${API}/energy/trend/${d}`).then(r => r.json());
      setTrend(data.map(r => ({
        time:  new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        kwh:   r.kwh,
        solar: r.solar_kwh,
      })));
    } catch (e) {
      console.error("Trend error:", e);
    }
  }, []);

  // On page load: fetch data, then refresh every 60 seconds
  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 60000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // When department button changes, fetch new trend
  useEffect(() => {
    fetchTrend(dept);
    const iv = setInterval(() => fetchTrend(dept), 60000);
    return () => clearInterval(iv);
  }, [dept, fetchTrend]);

  if (loading) return <LoadingScreen />;

  const waterK = summary.water_litres
    ? (summary.water_litres / 1000).toFixed(1)
    : "--";

  return (
    <div style={{
      background: "#0D1B2A", minHeight: "100vh",
      color: "white", fontFamily: "Arial, sans-serif",
      padding: "20px 24px",
    }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2ECC71" }}>
            🌿 Smart Campus Sustainability Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 12 }}>
            PSIT — Pranveer Singh Institute of Technology, Kanpur
            &nbsp;·&nbsp; Live data &nbsp;·&nbsp; Auto-refresh every 60s
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            background: "#1B4D3E", border: "1px solid #2ECC71",
            padding: "5px 14px", borderRadius: 8, fontSize: 12, color: "#A8DFBC"
          }}>
            🟢 System Live · Tick #{tick}
          </span>
          {lastSync && (
            <span style={{ fontSize: 11, color: "#475569" }}>
              Last update: {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── ANOMALY ALERT BANNER ────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{
          background: "#2A0F0D", border: "1px solid #E74C3C",
          borderRadius: 10, padding: "10px 16px", marginBottom: 16,
          fontSize: 13, color: "#FCA5A5"
        }}>
          ⚠️ &nbsp;<b>Energy Spike Detected</b>&nbsp; ·&nbsp;
          {alerts.map(a =>
            `${a.dept}: ${a.kwh} kWh (↑${a.spike_pct}% above normal)`
          ).join("  |  ")}
        </div>
      )}

      {/* ── TOP STAT CARDS ──────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12, marginBottom: 16
      }}>
        <StatBox icon="☀️" value={`${summary.solar_pct ?? "--"}%`}
          label="Solar Energy Share" color="#F4A017" />
        <StatBox icon="⚡" value={summary.total_kwh ?? "--"}
          label="Total kWh (7 days)" color="#0891B2" />
        <StatBox icon="🌿" value={`${summary.co2_saved_kg ?? "--"} kg`}
          label="CO₂ Avoided" color="#2ECC71" />
        <StatBox icon="💧" value={`${waterK}K L`}
          label="Water Used (7 days)" color="#6C3FC5" />
        <StatBox icon="🚨" value={alerts.length}
          label="Active Anomalies"
          color={alerts.length > 0 ? "#E74C3C" : "#2ECC71"} />
        <StatBox icon="🏆" value={scores[0]?.score ?? "--"}
          label={`Top Dept: ${scores[0]?.dept ?? ""}`} color="#2ECC71" />
      </div>

      {/* ── LEADERBOARD + ENERGY BAR CHART ─────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1.5fr",
        gap: 14, marginBottom: 14
      }}>

        {/* Green Score Leaderboard */}
        <Card>
          <SectionTitle color="#F4A017">🏆 Dept Green Score Leaderboard</SectionTitle>
          {scores.map((s, i) => (
            <div key={s.dept} style={{
              display: "flex", alignItems: "center",
              gap: 8, marginBottom: 10
            }}>
              {/* Rank number */}
              <span style={{
                width: 22, fontSize: 12, fontWeight: 700,
                color: i === 0 ? "#F4A017" : i === 1 ? "#94A3B8" : i === 2 ? "#CD7F32" : "#475569"
              }}>
                #{i + 1}
              </span>

              {/* Dept name */}
              <span style={{
                width: 36, fontSize: 13, fontWeight: 700,
                color: DEPT_COLOR[s.dept] ?? "#fff"
              }}>
                {s.dept}
              </span>

              {/* Progress bar */}
              <div style={{
                flex: 1, background: "#1C2E3F",
                borderRadius: 6, height: 18, overflow: "hidden"
              }}>
                <div style={{
                  width: `${s.score}%`, height: "100%",
                  background: scoreColor(s.score), borderRadius: 6,
                  transition: "width 1s ease"
                }} />
              </div>

              {/* Score number */}
              <span style={{
                fontSize: 14, fontWeight: 800, width: 28, textAlign: "right",
                color: scoreColor(s.score)
              }}>
                {s.score}
              </span>
            </div>
          ))}
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#475569" }}>
            Score based on energy savings vs dept baseline. Updates every 60s.
          </p>
        </Card>

        {/* Current Energy per Department */}
        <Card>
          <SectionTitle color="#0891B2">⚡ Live Energy Reading by Dept (kWh)</SectionTitle>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={energy} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2E3F" vertical={false} />
              <XAxis dataKey="dept" stroke="#475569" fontSize={11} tick={{ fill: "#64748B" }} />
              <YAxis stroke="#475569" fontSize={11} tick={{ fill: "#64748B" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="kwh" name="Energy (kWh)" radius={[5, 5, 0, 0]}>
                {energy.map(e => (
                  <Cell key={e.dept} fill={DEPT_COLOR[e.dept] ?? "#0891B2"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── TREND CHART ─────────────────────────────────────── */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8
        }}>
          <SectionTitle color="#6C3FC5" style={{ margin: 0 }}>
            📈 24-Hour Energy Trend — {dept}
          </SectionTitle>

          {/* Dept selector buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(DEPT_COLOR).map(d => (
              <button key={d} onClick={() => setDept(d)}
                style={{
                  background: dept === d ? DEPT_COLOR[d] : "#1C2E3F",
                  color: dept === d ? "#fff" : "#64748B",
                  border: "none", borderRadius: 6, padding: "4px 12px",
                  fontSize: 12, cursor: "pointer", fontWeight: 700,
                  transition: "all 0.2s"
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2E3F" />
            <XAxis dataKey="time" stroke="#475569" fontSize={10}
              tick={{ fill: "#64748B" }} interval="preserveStartEnd" />
            <YAxis stroke="#475569" fontSize={10} tick={{ fill: "#64748B" }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="kwh" name="Grid kWh"
              stroke={DEPT_COLOR[dept]} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="solar" name="Solar kWh"
              stroke="#F4A017" strokeWidth={2} dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>

        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#475569" }}>
          Solid line = grid electricity &nbsp;·&nbsp;
          Dashed gold = solar contribution &nbsp;·&nbsp;
          Click a dept button above to switch
        </p>
      </Card>

      {/* ── ANOMALY DETAIL CARDS ────────────────────────────── */}
      {alerts.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <SectionTitle color="#E74C3C">🚨 AI Anomaly Detection — Active Alerts</SectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
            gap: 10
          }}>
            {alerts.map(a => (
              <div key={a.dept} style={{
                background: "#2A0F0D", borderRadius: 10, padding: 14
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginBottom: 6
                }}>
                  <span style={{ fontWeight: 800, color: "#FCA5A5", fontSize: 15 }}>
                    {a.dept}
                  </span>
                  <span style={{
                    background: "#E74C3C", color: "#fff", borderRadius: 5,
                    padding: "2px 8px", fontSize: 10, fontWeight: 700
                  }}>
                    SPIKE
                  </span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#E74C3C" }}>
                  {a.kwh} kWh
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                  ↑ {a.spike_pct}% above 24h average ({a.avg} kWh)
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid #1C2E3F", marginTop: 16, paddingTop: 12,
        display: "flex", justifyContent: "space-between",
        flexWrap: "wrap", gap: 6, fontSize: 11, color: "#475569"
      }}>
        <span>🌿 Smart Campus Dashboard · PSIT Kanpur</span>
        <span>Built by Yash Kushwaha · SustainAI 1M1B · 2026</span>
        <span>Stack: React · FastAPI · Supabase · Render · Vercel</span>
      </div>

    </div>
  );
}
