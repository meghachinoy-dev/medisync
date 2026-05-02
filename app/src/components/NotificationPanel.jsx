import { useState } from 'react';
import { formatAlertTime, ALERT_ICONS } from '../utils/notifications';

const FILTERS = ['all', 'unread', 'critical', 'warning', 'info'];

function AlertItem({ alert, onMarkRead }) {
  const icon = ALERT_ICONS[alert.type] || 'ℹ️';

  return (
    <div className={`alert-item ${alert.read ? 'read' : 'unread'}`}>
      <div className="alert-icon">{icon}</div>
      <div className="alert-body">
        <div className="alert-msg">{alert.message}</div>
        <div className="alert-meta">
          <span className={`severity-badge severity-${alert.severity}`}>{alert.severity}</span>
          <span>{formatAlertTime(alert.createdAt)}</span>
          {alert.sentToCaregiver && (
            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 10 }}>
              ✓ Caregiver notified
            </span>
          )}
          {alert.compartment && <span>Compartment {alert.compartment}</span>}
        </div>
      </div>
      {!alert.read && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onMarkRead(alert.id)}
          style={{ flexShrink: 0 }}
        >
          Mark read
        </button>
      )}
    </div>
  );
}

export default function NotificationPanel({ alerts, markAlertRead }) {
  const [filter, setFilter] = useState('all');

  const alertList = Object.values(alerts || {}).sort((a, b) => b.createdAt - a.createdAt);

  const filtered = alertList.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !a.read;
    return a.severity === filter;
  });

  const unreadCount = alertList.filter((a) => !a.read).length;

  const markAll = () => {
    alertList.filter((a) => !a.read).forEach((a) => markAlertRead(a.id));
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2>Alerts &amp; Notifications</h2>
          <p>Missed doses, low stock, device alerts, and caregiver notifications</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAll}>
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div className="stats-row" style={{ marginBottom: 20 }}>
        {[
          ['Total', alertList.length, ''],
          ['Unread', unreadCount, 'red'],
          ['Critical', alertList.filter((a) => a.severity === 'critical').length, 'red'],
          ['Warnings', alertList.filter((a) => a.severity === 'warning').length, 'yellow'],
        ].map(([label, val, cls]) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-val">{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            No {filter === 'all' ? '' : filter} alerts.
          </div>
        ) : (
          filtered.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onMarkRead={markAlertRead} />
          ))
        )}
      </div>
    </div>
  );
}
