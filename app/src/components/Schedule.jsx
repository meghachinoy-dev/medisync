import { useState } from 'react';
import { buildWeekSchedule } from '../utils/scheduleBuilder';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Schedule({ medicines }) {
  const [selected, setSelected] = useState(null);
  const weekSchedule = buildWeekSchedule(medicines || {});
  const todayDow = new Date().getDay();

  return (
    <div>
      <div className="page-header">
        <h2>Weekly Schedule</h2>
        <p>Full 7-day medicine schedule grid</p>
      </div>

      <div className="card">
        <div className="week-grid">
          {DAYS.map((day, idx) => {
            const slots = weekSchedule[day] || [];
            const isToday = idx === todayDow;
            return (
              <div className="week-day-col" key={day}>
                <div className={`week-day-header ${isToday ? 'today' : ''}`}>
                  {day}
                  {isToday && <span style={{ fontSize: 10, marginLeft: 4 }}>▶</span>}
                </div>
                {slots.length === 0 ? (
                  <div className="week-cell">
                    <div className="week-cell-empty">No doses</div>
                  </div>
                ) : (
                  slots.map((slot, si) => (
                    <div
                      key={si}
                      className="week-cell"
                      onClick={() => setSelected({ day, slot })}
                      style={{ borderColor: isToday ? '#2563eb' : undefined }}
                    >
                      <div
                        className="week-cell-item"
                        style={{
                          background: slot.medicine.colorHex + '22',
                          color: slot.medicine.colorHex,
                        }}
                      >
                        {slot.time}
                      </div>
                      <div
                        className="week-cell-item"
                        style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}
                      >
                        {slot.medicine.name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dose Details — {selected.day}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: selected.slot.medicine.colorHex,
                marginBottom: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
              }}
            >
              💊
            </div>
            {[
              ['Medicine', selected.slot.medicine.name],
              ['Dosage', selected.slot.medicine.dosage],
              ['Form', selected.slot.medicine.form],
              ['Scheduled Time', selected.slot.time],
              ['Compartment', `#${selected.slot.medicine.compartmentNumber}`],
              ['Color', selected.slot.medicine.colorHex],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13,
                }}
              >
                <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">📋 Schedule Summary</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Medicine</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Dosage</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Times</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Days</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Compartment</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(medicines || {}).map((med) => (
                <tr key={med.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: med.colorHex }} />
                    <strong>{med.name}</strong>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{med.dosage}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div className="time-tags" style={{ margin: 0 }}>
                      {med.doseTimes.map((t) => (
                        <span key={t} className="time-tag" style={{ margin: 0 }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                    {med.scheduleDays.map((d) => DAYS[d]).join(', ')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>#{med.compartmentNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
