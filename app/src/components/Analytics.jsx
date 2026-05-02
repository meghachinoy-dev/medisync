import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  calcDailyCompliance,
  calcPerMedicineCompliance,
  calcMissedByHour,
  calcDayOfWeekCompliance,
  calcOverallCompliance,
} from '../utils/complianceCalc';

function HeatCell({ value, max }) {
  const intensity = max === 0 ? 0 : value / max;
  const r = Math.round(239 * intensity + 243 * (1 - intensity));
  const g = Math.round(68 * intensity + 244 * (1 - intensity));
  const b = Math.round(68 * intensity + 246 * (1 - intensity));
  return (
    <div
      style={{
        background: value === 0 ? '#f9fafb' : `rgb(${r},${g},${b})`,
        border: '1px solid #e5e7eb',
        borderRadius: 4,
        height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: value > 0 ? 600 : 400,
        color: intensity > 0.6 ? '#fff' : '#374151',
      }}
    >
      {value > 0 ? `${value}%` : '—'}
    </div>
  );
}

export default function Analytics({ doseLogs, medicines }) {
  const daily = useMemo(() => calcDailyCompliance(doseLogs, medicines, 30), [doseLogs, medicines]);
  const perMed = useMemo(() => calcPerMedicineCompliance(doseLogs, medicines, 30), [doseLogs, medicines]);
  const byHour = useMemo(() => calcMissedByHour(doseLogs, medicines, 30), [doseLogs, medicines]);
  const byDay = useMemo(() => calcDayOfWeekCompliance(doseLogs, medicines, 28), [doseLogs, medicines]);
  const overall = useMemo(() => calcOverallCompliance(doseLogs, medicines, 30), [doseLogs, medicines]);

  const bestDay = [...byDay].sort((a, b) => b.rate - a.rate)[0];
  const worstDay = [...byDay].sort((a, b) => a.rate - b.rate)[0];
  const maxMissRate = Math.max(...byHour.map((h) => h.missRate));
  const activeHours = byHour.filter((h) => h.total > 0);

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>30-day compliance analysis and trends</p>
      </div>

      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-val">{overall}%</div>
          <div className="stat-label">30-Day Compliance</div>
        </div>
        <div className="stat-card green">
          <div className="stat-val">{bestDay?.day || '—'}</div>
          <div className="stat-label">Best Day ({bestDay?.rate || 0}%)</div>
        </div>
        <div className="stat-card red">
          <div className="stat-val">{worstDay?.day || '—'}</div>
          <div className="stat-label">Worst Day ({worstDay?.rate || 0}%)</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-val">{perMed.length}</div>
          <div className="stat-label">Active Medicines</div>
        </div>
      </div>

      {/* 30-day compliance line */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">📈 30-Day Compliance Trend</div>
        <div className="chart-container" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={Math.floor(daily.length / 6)}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(val) => [`${val}%`, 'Compliance']}
              />
              <Line
                type="monotone" dataKey="rate" name="Compliance %"
                stroke="#2563eb" strokeWidth={2} dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Per-medicine compliance */}
        <div className="card">
          <div className="card-title">💊 Per-Medicine Compliance (30 days)</div>
          <div className="chart-container" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perMed} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(val) => [`${val}%`, 'Compliance']}
                />
                <Bar dataKey="rate" name="Compliance %" radius={[0, 4, 4, 0]}>
                  {perMed.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-of-week compliance */}
        <div className="card">
          <div className="card-title">📅 Compliance by Day of Week</div>
          <div className="chart-container" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(val) => [`${val}%`, 'Compliance']}
                />
                <Bar dataKey="rate" name="Compliance %" radius={[4, 4, 0, 0]}>
                  {byDay.map((entry) => (
                    <Cell
                      key={entry.day}
                      fill={entry.rate >= 80 ? '#16a34a' : entry.rate >= 60 ? '#d97706' : '#dc2626'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Missed dose heatmap by hour */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">🌡️ Missed Dose Heatmap — By Hour of Day</div>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          Darker red = higher miss rate at that hour. Only hours with scheduled doses are shown.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6 }}>
          {activeHours.map((h) => (
            <div key={h.hour}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, textAlign: 'center' }}>{h.hour}</div>
              <HeatCell value={h.missRate} max={maxMissRate || 100} />
            </div>
          ))}
        </div>
      </div>

      {/* Taken vs Missed table */}
      <div className="card">
        <div className="card-title">📋 30-Day Summary Table</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Medicine', '30-Day Total', 'Taken', 'Missed', 'Compliance'].map((h) => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perMed.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color }} />
                    {m.name}
                  </td>
                  <td style={{ padding: '9px 12px' }}>{m.total}</td>
                  <td style={{ padding: '9px 12px', color: '#16a34a', fontWeight: 600 }}>{m.taken}</td>
                  <td style={{ padding: '9px 12px', color: '#dc2626', fontWeight: 600 }}>{m.missed}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: m.rate >= 80 ? '#dcfce7' : m.rate >= 60 ? '#fef3c7' : '#fee2e2',
                      color: m.rate >= 80 ? '#16a34a' : m.rate >= 60 ? '#d97706' : '#dc2626',
                    }}>
                      {m.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
