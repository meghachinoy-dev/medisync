import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/medicines', label: 'Medicines', icon: '💊' },
  { to: '/schedule', label: 'Schedule', icon: '📅' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
  { to: '/ai-insights', label: 'AI Insights', icon: '🧠' },
  { to: '/hardware', label: 'Hardware', icon: '🔧' },
  { to: '/notifications', label: 'Alerts', icon: '🔔' },
];

export default function Sidebar({ isDemo, hardwareStatus, alertCount }) {
  const online = hardwareStatus?.online;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>
          Medi<span style={{ color: '#60a5fa' }}>Sync</span>
          <span className="sidebar-badge">IoT</span>
        </h1>
        <span>Smart Medicine Dispenser</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="nav-icon">{icon}</span>
            {label}
            {label === 'Alerts' && alertCount > 0 && (
              <span className="badge-count">{alertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {isDemo && (
          <div className="demo-badge">
            <span>⚡</span> Demo Mode
          </div>
        )}
        <div className="device-status">
          <div className={`dot ${online ? 'online' : 'offline'}`} />
          {online
            ? `${hardwareStatus?.deviceId || 'MEDISYNC-001'} online`
            : 'Device offline'}
        </div>
      </div>
    </aside>
  );
}
