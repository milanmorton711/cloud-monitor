import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const POLL_MS = 5000;
const EVENT_WINDOW_MIN = 60;
const EVENT_LIMIT = 3000;
const ALERT_LIMIT = 1000;
const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SEVERITY_COLORS = {
  CRITICAL: "#ff4d6a",
  HIGH: "#ff9f43",
  MEDIUM: "#f5d547",
  LOW: "#4dd4ac",
};

/* ---------- helpers ---------- */

function bucketize(items, buckets = 12, bucketMs = 5 * 60 * 1000) {
  const now = Date.now();
  const result = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const start = now - (i + 1) * bucketMs;
    const end = now - i * bucketMs;
    const count = items.filter((item) => {
      const t = new Date(item.timestamp).getTime();
      return t >= start && t < end;
    }).length;
    result.push({ time: new Date(end), count });
  }
  return result;
}

function countRecent(items, severity, minutes) {
  const cutoff = Date.now() - minutes * 60 * 1000;
  return items.filter(
    (item) =>
      item.severity === severity &&
      new Date(item.timestamp).getTime() >= cutoff
  ).length;
}

function timeAgo(timestamp) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function countBy(items, key) {
  const counts = {};
  items.forEach((item) => {
    const value = item[key] || "UNKNOWN";
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/* ---------- small charts ---------- */

function Sparkline({ data, color }) {
  const width = 120;
  const height = 36;
  const max = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - 4 - (d.count / max) * (height - 8),
  }));
  const line = smoothPath(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const id = `spark-${color.replace("#", "")}`;
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function AreaChart({ data }) {
  const width = 800;
  const height = 240;
  const padTop = 16;
  const padBottom = 8;
  const max = Math.max(...data.map((d) => d.count), 1);
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const [hover, setHover] = useState(null);

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y:
      height -
      padBottom -
      (d.count / niceMax) * (height - padTop - padBottom),
  }));
  const line = smoothPath(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const gridLines = [0, 1, 2, 3, 4];

  return (
    <div className="area-chart">
      <div className="area-yaxis">
        {gridLines
          .slice()
          .reverse()
          .map((g) => (
            <span key={g}>{Math.round((niceMax / 4) * g)}</span>
          ))}
      </div>
      <div className="area-plot">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {gridLines.map((g) => (
            <line
              key={g}
              x1="0"
              x2={width}
              y1={padTop + (g / 4) * (height - padTop - padBottom)}
              y2={padTop + (g / 4) * (height - padTop - padBottom)}
              className="grid-line"
            />
          ))}
          <path d={area} fill="url(#area-fill)" />
          <path d={line} className="area-line" />
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - width / data.length / 2}
              y="0"
              width={width / data.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
          {hover !== null && (
            <>
              <line
                x1={points[hover].x}
                x2={points[hover].x}
                y1="0"
                y2={height}
                className="hover-line"
              />
              <circle
                cx={points[hover].x}
                cy={points[hover].y}
                r="5"
                className="hover-dot"
              />
            </>
          )}
        </svg>
        {hover !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(points[hover].x / width) * 100}%`,
            }}
          >
            <strong>{data[hover].count} events</strong>
            <span>
              {data[hover].time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        <div className="area-xaxis">
          {data.map((d, i) =>
            i % 2 === 0 ? (
              <span key={d.time.toISOString()}>
                {d.time.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : (
              <span key={d.time.toISOString()} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function SeverityDonut({ alerts, stats }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Prefer the all time totals from the backend, and fall back to the
  // alerts already loaded if the stats endpoint is not available.
  const counts = SEVERITIES.map(
    (sev) =>
      stats?.severity?.[sev] ??
      alerts.filter((a) => a.severity === sev).length
  );
  const total = counts.reduce((sum, c) => sum + c, 0);
  const lengths = counts.map((count) =>
    total === 0 ? 0 : (count / total) * circumference
  );
  const segments = SEVERITIES.map((sev, i) => ({
    sev,
    count: counts[i],
    length: lengths[i],
    offset: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }));

  return (
    <div className="donut-wrap">
      <div className="donut">
        <svg viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} className="donut-track" />
          {segments.map(
            (s) =>
              s.length > 0 && (
                <circle
                  key={s.sev}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={SEVERITY_COLORS[s.sev]}
                  strokeWidth="14"
                  strokeDasharray={`${Math.max(s.length - 2, 0)} ${
                    circumference - Math.max(s.length - 2, 0)
                  }`}
                  strokeDashoffset={-s.offset}
                  transform="rotate(-90 70 70)"
                />
              )
          )}
        </svg>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>ALERTS</span>
        </div>
      </div>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.sev}>
            <span
              className="legend-dot"
              style={{ background: SEVERITY_COLORS[s.sev] }}
            />
            <span className="legend-name">{s.sev}</span>
            <strong>{s.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RankList({ items, color, empty }) {
  const max = Math.max(...items.map((i) => i[1]), 1);
  if (items.length === 0) return <div className="empty-state">{empty}</div>;
  return (
    <div className="rank-list">
      {items.map(([name, count]) => (
        <div className="rank-item" key={name}>
          <div className="rank-top">
            <span className="rank-name" title={name}>
              {name}
            </span>
            <strong>{count}</strong>
          </div>
          <div className="rank-bar">
            <span
              style={{
                width: `${(count / max) * 100}%`,
                background: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- cards and rows ---------- */

function MetricCard({ label, value, type, color, data, hint }) {
  return (
    <div className={`metric-card metric-card--${type}`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-hint">{hint}</span>
      </div>
      <div className="metric-bottom">
        <strong className="metric-value">{value}</strong>
        <Sparkline data={data} color={color} />
      </div>
    </div>
  );
}

function EventRow({ event }) {
  return (
    <article className="event-row">
      <span className="event-icon">
        {(event.eventType || "EV").slice(0, 2).toUpperCase()}
      </span>
      <div className="event-info">
        <div className="event-title">
          <strong>{event.username}</strong>
          <span className="event-type">{event.eventType}</span>
        </div>
        <span className="event-sub">
          {event.action} on {event.resource}
        </span>
      </div>
      <div className="event-side">
        <span className="event-region">{event.region}</span>
        <time>{timeAgo(event.timestamp)}</time>
      </div>
    </article>
  );
}

function AlertRow({ alert }) {
  const severity = alert.severity?.toLowerCase() || "medium";
  return (
    <article className={`alert-row alert-row--${severity}`}>
      <div className="alert-content">
        <div className="alert-heading">
          <span className={`severity severity--${severity}`}>
            {alert.severity}
          </span>
          <strong>{alert.detectionType}</strong>
          <time>{timeAgo(alert.timestamp)}</time>
        </div>
        <p>{alert.description}</p>
        <div className="alert-meta">
          <span className="chip">{alert.username}</span>
          <span className="chip chip--mono">{alert.resource}</span>
        </div>
      </div>
    </article>
  );
}

/* ---------- app ---------- */

function App() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [, setTick] = useState(0);

  const loadData = useCallback(async () => {
    try {
      // Only recent data is requested so the dashboard stays fast no
      // matter how many rows the database holds. All time totals come
      // from the stats endpoint.
      const [eventsResponse, alertsResponse, statsResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/events?minutes=${EVENT_WINDOW_MIN}&limit=${EVENT_LIMIT}`),
          fetch(`${API_URL}/api/alerts?limit=${ALERT_LIMIT}`),
          fetch(`${API_URL}/api/stats`),
        ]);
      if (!eventsResponse.ok || !alertsResponse.ok || !statsResponse.ok) {
        throw new Error("API request failed");
      }
      const eventsData = await eventsResponse.json();
      const alertsData = await alertsResponse.json();
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setStats(await statsResponse.json());
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error(err);
      setError("Backend connection failed. Retrying automatically.");
    }
  }, []);

  const generateEvents = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/simulation/generate`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Simulation request failed");
      }
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not generate simulated events.");
    } finally {
      setGenerating(false);
    }
  }, [loadData]);

  useEffect(() => {
    const initial = setTimeout(loadData, 0);
    if (!live) return () => clearTimeout(initial);
    const interval = setInterval(loadData, POLL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [live, loadData]);

  // re render every 15s so relative times stay fresh
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const eventBuckets = useMemo(() => bucketize(events), [events]);
  const alertBuckets = useMemo(() => bucketize(alerts), [alerts]);
  const criticalBuckets = useMemo(
    () => bucketize(alerts.filter((a) => a.severity === "CRITICAL")),
    [alerts]
  );
  const highBuckets = useMemo(
    () => bucketize(alerts.filter((a) => a.severity === "HIGH")),
    [alerts]
  );

  const metrics = useMemo(
    () => ({
      events: stats?.events ?? events.length,
      alerts: stats?.alerts ?? alerts.length,
      critical:
        stats?.severity?.CRITICAL ??
        alerts.filter((a) => a.severity === "CRITICAL").length,
      high:
        stats?.severity?.HIGH ??
        alerts.filter((a) => a.severity === "HIGH").length,
    }),
    [stats, events, alerts]
  );

  // Threat level reflects the last hour, not the all time totals,
  // so it can return to normal after a quiet period.
  const recentSeverity = useMemo(
    () => ({
      critical: countRecent(alerts, "CRITICAL", 60),
      high: countRecent(alerts, "HIGH", 60),
    }),
    [alerts]
  );

  const recentEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10),
    [events]
  );

  const filteredAlerts = useMemo(
    () =>
      [...alerts]
        .filter((a) => severityFilter === "ALL" || a.severity === severityFilter)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8),
    [alerts, severityFilter]
  );

  const detectionTypes = useMemo(
    () => countBy(alerts, "detectionType").slice(0, 6),
    [alerts]
  );
  const regions = useMemo(() => countBy(events, "region").slice(0, 6), [events]);
  const topUsers = useMemo(
    () => countBy(alerts, "username").slice(0, 6),
    [alerts]
  );

  const threatLevel =
    recentSeverity.critical > 0
      ? { label: "CRITICAL", cls: "critical" }
      : recentSeverity.high > 0
      ? { label: "ELEVATED", cls: "high" }
      : { label: "NORMAL", cls: "normal" };

  const offline = Boolean(error);

  return (
    <div className="dashboard">
      <div className="bg-glow bg-glow--a" />
      <div className="bg-glow bg-glow--b" />

      <header className="dashboard-header">
        <div className="brand-block">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1>Cloud Monitor</h1>
            <p className="subtitle">Cloud Security Detection and Response</p>
          </div>
        </div>

        <div className="header-actions">
          <div
            className={`threat-pill threat-pill--${threatLevel.cls}`}
            title="Based on alerts from the last 60 minutes"
          >
            <span>THREAT LEVEL</span>
            <strong>{threatLevel.label}</strong>
          </div>
          <div className={`system-status ${offline ? "is-offline" : ""}`}>
            <span className="status-dot" />
            <div>
              <span className="status-label">SYSTEM</span>
              <strong>{offline ? "OFFLINE" : "OPERATIONAL"}</strong>
            </div>
          </div>
          <button
            className={`toggle-button ${live ? "is-live" : ""}`}
            onClick={() => setLive((v) => !v)}
          >
            {live ? "LIVE" : "PAUSED"}
          </button>
          <button
            className="refresh-button simulate-button"
            onClick={generateEvents}
            disabled={generating}
          >
            {generating ? "GENERATING" : "SIMULATE"}
          </button>
          <button className="refresh-button" onClick={loadData}>
            REFRESH
          </button>
        </div>
      </header>

      {error && <div className="connection-error">{error}</div>}

      <main>
        <section className="metrics">
          <MetricCard
            label="CLOUD EVENTS"
            value={metrics.events}
            type="default"
            color="#38bdf8"
            data={eventBuckets}
            hint="All time"
          />
          <MetricCard
            label="TOTAL ALERTS"
            value={metrics.alerts}
            type="default"
            color="#a78bfa"
            data={alertBuckets}
            hint="All time"
          />
          <MetricCard
            label="CRITICAL"
            value={metrics.critical}
            type="critical"
            color={SEVERITY_COLORS.CRITICAL}
            data={criticalBuckets}
            hint="Act now"
          />
          <MetricCard
            label="HIGH"
            value={metrics.high}
            type="high"
            color={SEVERITY_COLORS.HIGH}
            data={highBuckets}
            hint="Investigate"
          />
        </section>

        <section className="row row--top">
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">LIVE TELEMETRY</span>
                <h2>Cloud Event Activity</h2>
              </div>
              <span className="panel-range">LAST 60 MIN</span>
            </div>
            <AreaChart data={eventBuckets} />
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">BREAKDOWN</span>
                <h2>Alert Severity</h2>
              </div>
            </div>
            <SeverityDonut alerts={alerts} stats={stats} />
          </section>
        </section>

        <section className="row row--mid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">DETECTIONS</span>
                <h2>Security Alerts</h2>
              </div>
              <div className="filter-group">
                {["ALL", ...SEVERITIES].map((sev) => (
                  <button
                    key={sev}
                    className={`filter-chip ${
                      severityFilter === sev ? "is-active" : ""
                    }`}
                    onClick={() => setSeverityFilter(sev)}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
            <div className="alert-list">
              {filteredAlerts.length === 0 ? (
                <div className="empty-state">NO ALERTS</div>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">EVENT STREAM</span>
                <h2>Recent Cloud Events</h2>
              </div>
              <span className="panel-range">{recentEvents.length} SHOWN</span>
            </div>
            <div className="event-list">
              {recentEvents.length === 0 ? (
                <div className="empty-state">NO EVENTS</div>
              ) : (
                recentEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))
              )}
            </div>
          </section>
        </section>

        <section className="row row--bottom">
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">ANALYTICS</span>
                <h2>Detection Types</h2>
              </div>
              <span className="panel-range">LATEST {ALERT_LIMIT}</span>
            </div>
            <RankList
              items={detectionTypes}
              color="linear-gradient(90deg, #38bdf8, #818cf8)"
              empty="NO DETECTIONS"
            />
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">GEOGRAPHY</span>
                <h2>Events by Region</h2>
              </div>
              <span className="panel-range">LAST {EVENT_WINDOW_MIN} MIN</span>
            </div>
            <RankList
              items={regions}
              color="linear-gradient(90deg, #34d399, #38bdf8)"
              empty="NO REGIONS"
            />
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">IDENTITY</span>
                <h2>Top Alerting Users</h2>
              </div>
              <span className="panel-range">LATEST {ALERT_LIMIT}</span>
            </div>
            <RankList
              items={topUsers}
              color="linear-gradient(90deg, #fb923c, #f472b6)"
              empty="NO USERS"
            />
          </section>
        </section>
      </main>

      <footer className="dashboard-footer">
        <span>CLOUD MONITOR v1.1</span>
        <span>
          {lastUpdated
            ? `LAST UPDATE ${lastUpdated.toLocaleTimeString()}`
            : "CONNECTING..."}
        </span>
      </footer>
    </div>
  );
}

export default App;
