import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080";

function App() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const [eventsResponse, alertsResponse] = await Promise.all([
        fetch(`${API_URL}/api/events`),
        fetch(`${API_URL}/api/alerts`),
      ]);

      if (!eventsResponse.ok || !alertsResponse.ok) {
        throw new Error("API request failed");
      }

      const eventsData = await eventsResponse.json();
      const alertsData = await alertsResponse.json();

      setEvents(eventsData);
      setAlerts(alertsData);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error(err);
      setError("BACKEND CONNECTION FAILED");
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(
    () => ({
      events: events.length,
      alerts: alerts.length,
      critical: alerts.filter((a) => a.severity === "CRITICAL").length,
      high: alerts.filter((a) => a.severity === "HIGH").length,
    }),
    [events, alerts]
  );

  const recentEvents = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        )
        .slice(0, 10),
    [events]
  );

  const recentAlerts = useMemo(
    () =>
      [...alerts]
        .sort(
          (a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        )
        .slice(0, 8),
    [alerts]
  );

  const telemetry = useMemo(() => {
    const now = Date.now();
    const buckets = [];

    for (let i = 11; i >= 0; i--) {
      const start = now - (i + 1) * 5 * 60 * 1000;
      const end = now - i * 5 * 60 * 1000;

      const count = events.filter((event) => {
        const time = new Date(event.timestamp).getTime();
        return time >= start && time < end;
      }).length;

      buckets.push({
        time: new Date(end),
        count,
      });
    }

    return buckets;
  }, [events]);

  const maxEvents = Math.max(
    ...telemetry.map((bucket) => bucket.count),
    1
  );

  const detectionTypes = useMemo(() => {
    const counts = {};

    alerts.forEach((alert) => {
      counts[alert.detectionType] =
        (counts[alert.detectionType] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <div className="brand">
            <span className="brand-mark">CM</span>
            CLOUD MONITOR
          </div>

          <p className="subtitle">
            Cloud Security Detection & Response
          </p>
        </div>

        <div className="system-status">
          <span className="status-dot" />

          <div>
            <span className="status-label">SYSTEM</span>
            <strong>
              {error ? "OFFLINE" : "OPERATIONAL"}
            </strong>
          </div>
        </div>
      </header>

      {error && (
        <div className="connection-error">
          {error}
        </div>
      )}

      <main>
        <section className="metrics">
          <MetricCard
            label="CLOUD EVENTS"
            value={metrics.events}
            type="default"
          />

          <MetricCard
            label="TOTAL ALERTS"
            value={metrics.alerts}
            type="default"
          />

          <MetricCard
            label="CRITICAL"
            value={metrics.critical}
            type="critical"
          />

          <MetricCard
            label="HIGH"
            value={metrics.high}
            type="high"
          />
        </section>

        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                LIVE TELEMETRY
              </span>

              <h2>Cloud Event Activity</h2>
            </div>

            <span className="panel-range">
              LAST 60 MIN
            </span>
          </div>

          <div className="activity-graph">
            <div className="graph-grid">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="graph-bars">
              {telemetry.map((bucket) => (
                <div
                  className="graph-bar"
                  key={bucket.time.toISOString()}
                  title={`${bucket.count} events`}
                >
                  <span
                    className="graph-bar-fill"
                    style={{
                      height:
                        bucket.count === 0
                          ? "0%"
                          : `${Math.max(
                              (bucket.count / maxEvents) * 100,
                              8
                            )}%`,
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="graph-labels">
              {telemetry.map((bucket) => (
                <span key={bucket.time.toISOString()}>
                  {bucket.time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="content-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  EVENT STREAM
                </span>

                <h2>Recent Cloud Events</h2>
              </div>

              <button
                className="refresh-button"
                onClick={loadData}
              >
                REFRESH
              </button>
            </div>

            <div className="event-list">
              {recentEvents.length === 0 ? (
                <div className="empty-state">
                  NO EVENTS
                </div>
              ) : (
                recentEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                  />
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  DETECTIONS
                </span>

                <h2>Security Alerts</h2>
              </div>
            </div>

            <div className="alert-list">
              {recentAlerts.length === 0 ? (
                <div className="empty-state">
                  NO ALERTS
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                  />
                ))
              )}
            </div>
          </section>
        </section>

        <section className="panel detections-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                ANALYTICS
              </span>

              <h2>Detection Types</h2>
            </div>
          </div>

          <div className="detection-list">
            {detectionTypes.length === 0 ? (
              <div className="empty-state">
                NO DETECTIONS
              </div>
            ) : (
              detectionTypes.map(([type, count]) => (
                <div
                  className="detection-item"
                  key={type}
                >
                  <span className="detection-name">
                    {type}
                  </span>

                  <div className="detection-bar">
                    <span
                      style={{
                        width: `${Math.min(
                          count * 10,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>{count}</strong>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <span>CLOUD MONITOR v1.0</span>

        <span>
          {lastUpdated
            ? `LAST UPDATE ${lastUpdated.toLocaleTimeString()}`
            : "CONNECTING..."}
        </span>
      </footer>
    </div>
  );
}

function MetricCard({ label, value, type }) {
  return (
    <div className={`metric-card metric-card--${type}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EventRow({ event }) {
  return (
    <article className="event-row">
      <span className="event-type">
        {event.eventType}
      </span>

      <div className="event-info">
        <strong>{event.username}</strong>

        <span>
          {event.action} · {event.resource}
        </span>
      </div>

      <span className="event-region">
        {event.region}
      </span>

      <time>
        {new Date(event.timestamp).toLocaleTimeString()}
      </time>
    </article>
  );
}

function AlertRow({ alert }) {
  const severity =
    alert.severity?.toLowerCase() || "medium";

  return (
    <article className="alert-row">
      <span
        className={`alert-indicator alert-indicator--${severity}`}
      />

      <div className="alert-content">
        <div className="alert-heading">
          <span className={`severity severity--${severity}`}>
            {alert.severity}
          </span>

          <strong>{alert.detectionType}</strong>
        </div>

        <p>{alert.description}</p>

        <div className="alert-meta">
          <span>
            {alert.username}
          </span>

          <span>
            {alert.resource}
          </span>
        </div>
      </div>

      <time>
        {new Date(alert.timestamp).toLocaleTimeString()}
      </time>
    </article>
  );
}

export default App;