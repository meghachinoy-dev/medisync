function SignalBar({ dbm }) {
  if (!dbm) return <span style={{ color: '#9ca3af' }}>—</span>;
  const strength = dbm >= -50 ? 100 : dbm >= -60 ? 75 : dbm >= -70 ? 50 : 25;
  const color = strength >= 75 ? '#16a34a' : strength >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        {[20, 40, 60, 80].map((h, i) => (
          <div
            key={i}
            style={{
              width: 5, height: h * 0.4,
              background: strength > i * 25 ? color : '#e5e7eb',
              borderRadius: 1,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color }}>{dbm} dBm</span>
    </div>
  );
}

function BatteryBar({ percent }) {
  if (percent == null) return <span style={{ color: '#9ca3af' }}>—</span>;
  const color = percent > 50 ? '#16a34a' : percent > 20 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 40, height: 12, border: '2px solid #d1d5db', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
        <div style={{ position: 'absolute', right: -5, top: 3, width: 3, height: 6, background: '#9ca3af', borderRadius: '0 2px 2px 0' }} />
        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: 1 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{percent}%</span>
    </div>
  );
}

function CompartmentCard({ num, compartment, medicines }) {
  const med = compartment.medicineId ? medicines[compartment.medicineId] : null;
  const fillPct = compartment.pillsMax > 0
    ? Math.round((compartment.pillsRemaining / compartment.pillsMax) * 100)
    : 0;
  const fillColor = fillPct > 40 ? '#16a34a' : fillPct > 15 ? '#d97706' : '#dc2626';
  const status = compartment.status || 'UNASSIGNED';

  const statusColors = {
    OK: { bg: '#f0fdf4', border: '#bbf7d0', badge: '#16a34a', badgeBg: '#dcfce7' },
    LOW: { bg: '#fffbeb', border: '#fde68a', badge: '#d97706', badgeBg: '#fef3c7' },
    EMPTY: { bg: '#fff8f8', border: '#fecaca', badge: '#dc2626', badgeBg: '#fee2e2' },
    UNASSIGNED: { bg: '#f9fafb', border: '#e5e7eb', badge: '#9ca3af', badgeBg: '#f3f4f6' },
  };
  const sc = statusColors[status] || statusColors.UNASSIGNED;

  return (
    <div style={{
      padding: 16, borderRadius: 10, border: `2px solid ${sc.border}`,
      background: sc.bg,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
          Compartment {num}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
          background: sc.badgeBg, color: sc.badge,
        }}>
          {status}
        </span>
      </div>

      {med ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: med.colorHex }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</span>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{med.dosage} · {med.form}</div>
        </>
      ) : (
        <div style={{ fontWeight: 500, fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>Unassigned</div>
      )}

      <div className="fill-bar">
        <div
          className="fill-bar-inner"
          style={{ width: `${fillPct}%`, background: fillColor }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
        <span>{compartment.pillsRemaining} / {compartment.pillsMax} pills</span>
        <span style={{ fontWeight: 600, color: fillColor }}>{fillPct}%</span>
      </div>

      {compartment.lastRefilled && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          Refilled: {new Date(compartment.lastRefilled).toLocaleDateString('en-IN')}
        </div>
      )}
    </div>
  );
}

export default function HardwareMonitor({ hardwareStatus, compartments, medicines, isDemo }) {
  const hw = hardwareStatus || {};

  return (
    <div>
      <div className="page-header">
        <h2>Hardware Monitor</h2>
        <p>Real-time NodeMCU device status and compartment levels</p>
      </div>

      {/* Device overview */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">🔧 Device Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: hw.online ? '#f0fdf4' : '#fff8f8', borderRadius: 8, border: `1px solid ${hw.online ? '#bbf7d0' : '#fecaca'}` }}>
            <div className={`dot ${hw.online ? 'online' : 'offline'}`} style={{ width: 12, height: 12 }} />
            <span style={{ fontWeight: 700, color: hw.online ? '#16a34a' : '#dc2626', fontSize: 15 }}>
              {hw.online ? 'Device Online' : 'Device Offline'}
            </span>
            {hw.online && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
                Last seen {hw.lastSeen ? `${Math.round((Date.now() - hw.lastSeen) / 1000)}s ago` : '—'}
              </span>
            )}
          </div>

          {[
            ['Device ID', hw.deviceId || '—'],
            ['Firmware Version', hw.firmwareVersion ? `v${hw.firmwareVersion}` : '—'],
            ['WiFi Network', hw.wifiSSID || '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{val}</span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>WiFi Signal</span>
            <SignalBar dbm={hw.wifiStrength} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Battery Level</span>
            <BatteryBar percent={hw.batteryPercent} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">⏱️ Activity Log</div>
          {[
            ['Last Dispense', hw.lastDispenseTime ? new Date(hw.lastDispenseTime).toLocaleString('en-IN') : 'No dispenses yet'],
            ['Last Firebase Sync', hw.lastSeen ? new Date(hw.lastSeen).toLocaleString('en-IN') : '—'],
            ['Uptime', hw.online ? 'Active' : 'Offline'],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div>
            </div>
          ))}

          {isDemo && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
              ⚡ Running in demo mode. Connect Firebase + NodeMCU for live hardware data.
            </div>
          )}
        </div>
      </div>

      {/* Compartments */}
      <div className="card">
        <div className="card-title">📦 Compartment Status</div>
        <div className="compartment-grid">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <CompartmentCard
              key={num}
              num={num}
              compartment={compartments[num] || { status: 'UNASSIGNED', pillsRemaining: 0, pillsMax: 30 }}
              medicines={medicines}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
