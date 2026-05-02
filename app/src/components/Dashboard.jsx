import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getTodayStats, calcDailyCompliance } from '../utils/complianceCalc';

function ComplianceRing({ value }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const fill = circ * (value / 100);
  const color = value >= 80 ? '#16a34a' : value >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="compliance-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="ring-val" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function Dashboard({ todaySchedule, doseLogs, medicines, hardwareStatus, lastSync, isDemo }) {
  const stats = getTodayStats(todaySchedule);

  const weekData = useMemo(() => {
    if (!doseLogs || !medicines) return [];
    return calcDailyCompliance(doseLogs, medicines, 7).map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
    }));
  }, [doseLogs, medicines]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>{formattedDate}</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card green">
          <div className="stat-val">{stats.taken}</div>
          <div className="stat-label">Taken Today</div>
        </div>
        <div className="stat-card red">
          <div className="stat-val">{stats.missed}</div>
          <div className="stat-label">Missed</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-val">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-val">{stats.upcoming}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 1' }}>
          <ComplianceRing value={isNaN(stats.compliance) ? 0 : stats.compliance} />
          <div className="stat-label" style={{ marginTop: 4 }}>Today's Compliance</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Today's timeline */}
        <div className="card">
          <div className="card-title">📋 Today's Dose Timeline</div>
          {todaySchedule.length === 0 ? (
            <div className="empty-state">No doses scheduled for today.</div>
          ) : (
            <div className="timeline">
              {todaySchedule.map((slot) => (
                <div className="timeline-item" key={slot.id}>
                  <div className="timeline-time">{slot.adaptedTime}</div>
                  <div
                    className="timeline-dot"
                    style={{ background: slot.medicine.colorHex }}
                  />
                  <div className="timeline-info">
                    <div className="timeline-name">{slot.medicine.name}</div>
                    <div className="timeline-meta">
                      {slot.medicine.dosage} · Compartment {slot.compartmentNumber}
                      {slot.isAdapted && (
                        <span style={{ color: '#7c3aed', marginLeft: 4 }}>
                          (adapted from {slot.scheduledTime})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`status-badge status-${slot.status}`}>{slot.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync status + device */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-title">📡 Device Sync Status</div>
            <div className="sync-row" style={{ marginBottom: 10 }}>
              <span className={`dot ${hardwareStatus?.online ? 'online pulse' : 'offline'}`} />
              <span style={{ fontWeight: 600 }}>
                {hardwareStatus?.online ? 'Device Online' : 'Device Offline'}
              </span>
            </div>
            {[
              ['Device ID', hardwareStatus?.deviceId || '—'],
              ['WiFi SSID', hardwareStatus?.wifiSSID || '—'],
              ['WiFi Signal', hardwareStatus?.wifiStrength ? `${hardwareStatus.wifiStrength} dBm` : '—'],
              ['Firmware', hardwareStatus?.firmwareVersion ? `v${hardwareStatus.firmwareVersion}` : '—'],
              ['Battery', hardwareStatus?.batteryPercent ? `${hardwareStatus.batteryPercent}%` : '—'],
              ['Last Sync', lastSync ? new Date(lastSync).toLocaleTimeString() : '—'],
              ['Last Dispense',
                hardwareStatus?.lastDispenseTime
                  ? new Date(hardwareStatus.lastDispenseTime).toLocaleTimeString()
                  : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            {isDemo && (
              <div style={{ marginTop: 10, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                ⚡ Demo mode — connect Firebase for live data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="card">
        <div className="card-title">📊 7-Day Dose Overview</div>
        <div className="chart-container" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="taken" name="Taken" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missed" name="Missed" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
