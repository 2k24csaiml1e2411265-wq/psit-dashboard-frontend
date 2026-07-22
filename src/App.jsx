import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";

const API = process.env.REACT_APP_API_URL || "https://campus-dashboard-api.onrender.com";

/* ─── Design tokens ─────────────────────────────────────────
   Palette: white base, slate text, one green accent (#16a34a),
   subtle grays for borders and backgrounds.
   No dark mode, no neon, no glows.
───────────────────────────────────────────────────────────── */
const C = {
  green:     "#16a34a",
  greenLight:"#dcfce7",
  greenMid:  "#86efac",
  amber:     "#d97706",
  amberLight:"#fef3c7",
  red:       "#dc2626",
  redLight:  "#fee2e2",
  blue:      "#2563eb",
  blueLight: "#dbeafe",
  gray50:    "#f9fafb",
  gray100:   "#f3f4f6",
  gray200:   "#e5e7eb",
  gray400:   "#9ca3af",
  gray500:   "#6b7280",
  gray700:   "#374151",
  gray900:   "#111827",
};

const scoreColor = (s) =>
  s >= 70 ? C.green : s >= 50 ? C.amber : C.red;

const scoreBg = (s) =>
  s >= 70 ? C.greenLight : s >= 50 ? C.amberLight : C.redLight;

const DEPT_COLORS = {
  CSE:"#2563eb", ECE:"#7c3aed", ME:"#d97706",
  CE: "#0891b2", MBA:"#16a34a", MCA:"#db2777", EEE:"#ea580c",
};

/* ─── Tiny style helpers ─────────────────────────────────── */
const styles = {
  page: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "light-grey",
    minHeight: "100vh",
    color: C.gray900,
    fontSize: 14,
  },
  topbar: {
    borderBottom: `1px solid ${C.gray200}`,
    padding: "0 24px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 600,
    fontSize: 15,
    color: C.gray900,
  },
  logoIcon: {
    width: 28,
    height: 28,
    background: C.green,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
  },
  statusBadge: (live) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: live ? C.green : C.gray500,
    background: live ? C.greenLight : C.gray100,
    border: `1px solid ${live ? C.greenMid : C.gray200}`,
    borderRadius: 20,
    padding: "3px 10px",
    fontWeight: 500,
  }),
  dot: (live) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: live ? C.green : C.gray400,
  }),
  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 24px",
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: C.gray900,
    margin: "0 0 4px",
  },
  pageSubtitle: {
    fontSize: 13,
    color: C.gray500,
    margin: 0,
  },
  alertBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: C.redLight,
    border: `1px solid #fca5a5`,
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 20,
    fontSize: 13,
    color: "#7f1d1d",
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    border: `1px solid ${C.gray200}`,
    borderRadius: 10,
    padding: "16px 18px",
    background: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: C.gray500,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    margin: "0 0 8px",
  },
  statValue: (color) => ({
    fontSize: 26,
    fontWeight: 700,
    color: color || C.gray900,
    margin: "0 0 2px",
    lineHeight: 1.1,
  }),
  statSub: {
    fontSize: 12,
    color: C.gray400,
    margin: 0,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 16,
    marginBottom: 16,
  },
  card: {
    border: `1px solid ${C.gray200}`,
    borderRadius: 10,
    background: "#fff",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "14px 18px",
    borderBottom: `1px solid ${C.gray100}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: C.gray700,
    margin: 0,
  },
  cardBody: {
    padding: "16px 18px",
  },
  lbRow: (i) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 0",
    borderBottom: i < 6 ? `1px solid ${C.gray100}` : "none",
  }),
  lbRank: (i) => ({
    width: 22,
    fontSize: 12,
    fontWeight: 700,
    color: i === 0 ? "#92400e" : i === 1 ? C.gray500 : C.gray400,
    flexShrink: 0,
    textAlign: "center",
  }),
  lbDept: {
    width: 36,
    fontSize: 13,
    fontWeight: 600,
    color: C.gray700,
    flexShrink: 0,
  },
  lbBarTrack: {
    flex: 1,
    height: 6,
    background: C.gray100,
    borderRadius: 3,
    overflow: "hidden",
  },
  lbBarFill: (score) => ({
    height: "100%",
    width: `${score}%`,
    background: scoreColor(score),
    borderRadius: 3,
    transition: "width 0.8s ease",
  }),
  lbScore: (score) => ({
    fontSize: 13,
    fontWeight: 700,
    color: scoreColor(score),
    width: 26,
    textAlign: "right",
    flexShrink: 0,
  }),
  lbBadge: (score) => ({
    fontSize: 10,
    fontWeight: 600,
    color: scoreColor(score),
    background: scoreBg(score),
    borderRadius: 4,
    padding: "1px 5px",
    flexShrink: 0,
    minWidth: 28,
    textAlign: "center",
  }),
  deptBtns: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  deptBtn: (active, dept) => ({
    padding: "4px 10px",
    borderRadius: 6,
    border: `1px solid ${active ? DEPT_COLORS[dept] : C.gray200}`,
    background: active ? DEPT_COLORS[dept] : "#fff",
    color: active ? "#fff" : C.gray500,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  }),
  anomalyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 10,
  },
  anomalyCard: {
    border: `1px solid #fca5a5`,
    borderRadius: 8,
    padding: "12px 14px",
    background: C.redLight,
  },
  tag: (color, bg) => ({
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    color,
    background: bg,
    borderRadius: 4,
    padding: "2px 7px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }),
  footer: {
    borderTop: `1px solid ${C.gray100}`,
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: C.gray400,
    flexWrap: "wrap",
    gap: 8,
    marginTop: 24,
  },
};

/* ─── Custom chart tooltip ───────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${C.gray200}`,
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    }}>
      <p style={{ margin: "0 0 4px", color: C.gray500 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ margin: "2px 0", color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Loading ────────────────────────────────────────────── */
function Loading() {
  return (
    <div style={{
      ...styles.page,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 12,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: C.green }} />
      <p style={{ color: C.gray500, margin: 0, fontSize: 14 }}>
        🌿Loading campus data...
      </p>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────── */
export default function App() {
  const [scores,  setScores]  = useState([]);
  const [energy,  setEnergy]  = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [summary, setSummary] = useState({});
  const [trend,   setTrend]   = useState([]);
  const [dept,    setDept]    = useState("CSE");
  const [synced,  setSynced]  = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [sc, en, al, su] = await Promise.all([
        fetch(`${API}/scores`).then(r => r.json()),
        fetch(`${API}/energy/latest`).then(r => r.json()),
        fetch(`${API}/anomalies`).then(r => r.json()),
        fetch(`${API}/summary`).then(r => r.json()),
      ]);
      setScores(sc); setEnergy(en); setAlerts(al); setSummary(su);
      setSynced(new Date());
      setLoading(false);
    } catch (e) { console.error(e); }
  }, []);

  const fetchTrend = useCallback(async (d) => {
    try {
      const data = await fetch(`${API}/energy/trend/${d}`).then(r => r.json());
      setTrend(data.map(r => ({
        time:  new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        "Grid kWh":  r.kwh,
        "Solar kWh": r.solar_kwh,
      })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 60000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  useEffect(() => {
    fetchTrend(dept);
    const iv = setInterval(() => fetchTrend(dept), 60000);
    return () => clearInterval(iv);
  }, [dept, fetchTrend]);

  if (loading) return <Loading />;

  const waterK = summary.water_litres
    ? (summary.water_litres / 1000).toFixed(1) : "--";

  return (
    <div style={styles.page}>

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <header style={styles.topbar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🌿</div>
          <span>Campus Dashboard-PSIT Kanpur</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {synced && (
            <span style={{ fontSize: 12, color: C.gray400 }}>
              Updated {synced.toLocaleTimeString()}
            </span>
          )}
          <span style={styles.statusBadge(true)}>
            <span style={styles.dot(true)} />
            Live
          </span>
        </div>
      </header>

      <main style={styles.main}>

        {/* ── PAGE HEADER ──────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Sustainability Overview</h1>
          <p style={styles.pageSubtitle}>
            Real-time energy, solar, and water monitoring across 7 departments.
            Data refreshes every 60 seconds.
          </p>
        </div>

        {/* ── ALERT BANNER ─────────────────────────────── */}
        {alerts.length > 0 && (
          <div style={styles.alertBanner}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              <strong>Energy anomaly detected</strong>
              <p style={{ margin: "2px 0 0", color: "#991b1b" }}>
                {alerts.map(a =>
                  `${a.dept} is using ${a.kwh} kWh — ${a.spike_pct}% above the 24-hour average of ${a.avg} kWh.`
                ).join("  ·  ")}
              </p>
            </div>
          </div>
        )}

        {/* ── STAT CARDS ───────────────────────────────── */}
        <div style={styles.grid4}>
          {[
            { label:"Solar share",         value:`${summary.solar_pct ?? "--"}%`,       sub:"of total campus consumption",   color: C.green },
            { label:"Energy used (7 days)", value:`${summary.total_kwh ?? "--"} kWh`,   sub:"across all 7 departments",      color: C.gray900 },
            { label:"CO₂ avoided",          value:`${summary.co2_saved_kg ?? "--"} kg`,  sub:"via solar generation",          color: C.blue },
            { label:"Water used (7 days)",  value:`${waterK}K litres`,                   sub:"RO plant total",                color: C.gray900 },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <p style={styles.statLabel}>{s.label}</p>
              <p style={styles.statValue(s.color)}>{s.value}</p>
              <p style={styles.statSub}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── LEADERBOARD + ENERGY BAR ─────────────────── */}
        <div style={styles.grid2}>

          {/* Leaderboard */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <p style={styles.cardTitle}>Department Green Score</p>
              <span style={styles.tag(C.gray500, C.gray100)}>
                This week
              </span>
            </div>
            <div style={{ padding: "4px 18px 10px" }}>
              {scores.map((s, i) => (
                <div key={s.dept} style={styles.lbRow(i)}>
                  <span style={styles.lbRank(i)}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span style={styles.lbDept}>{s.dept}</span>
                  <div style={styles.lbBarTrack}>
                    <div style={styles.lbBarFill(s.score)} />
                  </div>
                  <span style={styles.lbScore(s.score)}>{s.score}</span>
                  <span style={styles.lbBadge(s.score)}>
                    {s.score >= 70 ? "Good" : s.score >= 50 ? "OK" : "Low"}
                  </span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: C.gray400, margin: "10px 0 0" }}>
                Score based on energy efficiency vs department baseline.
                Updates every 60 seconds.
              </p>
            </div>
          </div>

          {/* Energy bar chart */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <p style={styles.cardTitle}>Current energy reading by department</p>
              <span style={styles.tag(C.gray500, C.gray100)}>kWh</span>
            </div>
            <div style={{ padding: "12px 8px 12px 4px" }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={energy} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} vertical={false} />
                  <XAxis
                    dataKey="dept"
                    tick={{ fill: C.gray500, fontSize: 12 }}
                    axisLine={{ stroke: C.gray200 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: C.gray400, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTip />}
                    cursor={{ fill: C.gray50 }}
                  />
                  <Bar
                    dataKey="kwh"
                    name="Energy (kWh)"
                    radius={[4, 4, 0, 0]}
                    fill={C.blue}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── TREND CHART ──────────────────────────────── */}
        <div style={{ ...styles.card, marginBottom: 16 }}>
          <div style={styles.cardHeader}>
            <p style={styles.cardTitle}>
              24-hour energy trend
              <span style={{ color: C.gray400, fontWeight: 400 }}> — {dept}</span>
            </p>
            <div style={styles.deptBtns}>
              {["CSE","ECE","ME","CE","MBA","MCA","EEE"].map(d => (
                <button
                  key={d}
                  onClick={() => setDept(d)}
                  style={styles.deptBtn(dept === d, d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "12px 8px 12px 4px" }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trend} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: C.gray400, fontSize: 11 }}
                  axisLine={{ stroke: C.gray200 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: C.gray400, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTip />} cursor={{ stroke: C.gray200 }} />
                <Line
                  type="monotone"
                  dataKey="Grid kWh"
                  stroke={DEPT_COLORS[dept]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: DEPT_COLORS[dept] }}
                />
                <Line
                  type="monotone"
                  dataKey="Solar kWh"
                  stroke={C.green}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 3"
                  activeDot={{ r: 3, fill: C.green }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 11, color: C.gray400, margin: "8px 0 0 16px" }}>
              Solid line = grid consumption &nbsp;·&nbsp;
              Dashed green = solar contribution &nbsp;·&nbsp;
              Click a department to switch
            </p>
          </div>
        </div>

        {/* ── ANOMALY TABLE ─────────────────────────────── */}
        {alerts.length > 0 && (
          <div style={{ ...styles.card, marginBottom: 16 }}>
            <div style={styles.cardHeader}>
              <p style={styles.cardTitle}>Active anomalies</p>
              <span style={styles.tag(C.red, C.redLight)}>
                {alerts.length} alert{alerts.length > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={styles.anomalyGrid}>
                {alerts.map(a => (
                  <div key={a.dept} style={styles.anomalyCard}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 6,
                    }}>
                      <span style={{ fontWeight: 700, color: C.red, fontSize: 15 }}>
                        {a.dept}
                      </span>
                      <span style={styles.tag(C.red, "#fecaca")}>Spike</span>
                    </div>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 20, color: "#7f1d1d" }}>
                      {a.kwh} kWh
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#991b1b" }}>
                      {a.spike_pct}% above 24h average ({a.avg} kWh)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer style={styles.footer}>
          <span>PSIT — Pranveer Singh Institute of Technology, Kanpur</span>
          <span>Built by Yash Kushwaha · SustainAI 1M1B · 2026</span>
          <span>React · FastAPI · Supabase · Render · Vercel</span>
        </footer>

      </main>
    </div>
  );
}
