import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'drops'];
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];

const EMPTY_FORM = {
  name: '',
  dosage: '',
  form: 'tablet',
  compartmentNumber: 1,
  colorHex: '#3b82f6',
  scheduleDays: [0, 1, 2, 3, 4, 5, 6],
  doseTimes: ['08:00'],
  active: true,
};

function MedicineForm({ initial, onSave, onCancel, usedCompartments }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [newTime, setNewTime] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleDay = (idx) => {
    setForm((f) => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(idx)
        ? f.scheduleDays.filter((d) => d !== idx)
        : [...f.scheduleDays, idx].sort(),
    }));
  };

  const addTime = () => {
    if (!newTime || form.doseTimes.includes(newTime)) return;
    setForm((f) => ({ ...f, doseTimes: [...f.doseTimes, newTime].sort() }));
    setNewTime('');
  };

  const removeTime = (t) => {
    setForm((f) => ({ ...f, doseTimes: f.doseTimes.filter((x) => x !== t) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.doseTimes.length === 0 || form.scheduleDays.length === 0) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Medicine Name *</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Metformin"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Dosage Strength *</label>
          <input
            className="form-input"
            value={form.dosage}
            onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
            placeholder="e.g. 500mg"
            required
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Dosage Form</label>
          <select
            className="form-select"
            value={form.form}
            onChange={(e) => setForm((f) => ({ ...f, form: e.target.value }))}
          >
            {FORMS.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Compartment (1–6)</label>
          <select
            className="form-select"
            value={form.compartmentNumber}
            onChange={(e) => setForm((f) => ({ ...f, compartmentNumber: Number(e.target.value) }))}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n} disabled={usedCompartments.includes(n) && form.compartmentNumber !== n}>
                Compartment {n} {usedCompartments.includes(n) && form.compartmentNumber !== n ? '(in use)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Color Marker</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {COLORS.map((c) => (
            <div
              key={c}
              onClick={() => setForm((f) => ({ ...f, colorHex: c }))}
              style={{
                width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                border: form.colorHex === c ? '3px solid #111' : '3px solid transparent',
                transition: 'border 0.1s',
              }}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Schedule Days</label>
        <div className="day-chips">
          {DAYS.map((d, idx) => (
            <div
              key={d}
              className={`day-chip ${form.scheduleDays.includes(idx) ? 'selected' : ''}`}
              onClick={() => toggleDay(idx)}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Dose Times</label>
        <div className="time-tags">
          {form.doseTimes.map((t) => (
            <span key={t} className="time-tag">
              {t}
              <button type="button" onClick={() => removeTime(t)}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="time"
            className="form-input"
            style={{ flex: 1 }}
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />
          <button type="button" className="btn btn-secondary" onClick={addTime}>
            + Add Time
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Medicine'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function MedicineManager({ medicines, addMedicine, updateMedicine, deleteMedicine }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const usedCompartments = Object.values(medicines).map((m) => m.compartmentNumber);

  const handleSave = async (form) => {
    if (editId) {
      await updateMedicine(editId, form);
    } else {
      await addMedicine(form);
    }
    setShowForm(false);
    setEditId(null);
  };

  const handleEdit = (med) => {
    setEditId(med.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await deleteMedicine(id);
    setDeleteConfirm(null);
  };

  const medList = Object.values(medicines);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2>Medicine Manager</h2>
          <p>Add, edit, or remove medicines and assign compartments</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setEditId(null); }}
        >
          + Add Medicine
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">
            {editId ? '✏️ Edit Medicine' : '➕ Add New Medicine'}
          </div>
          <MedicineForm
            initial={editId ? medicines[editId] : null}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditId(null); }}
            usedCompartments={usedCompartments}
          />
        </div>
      )}

      <div className="card">
        <div className="card-title">💊 Current Medicines ({medList.length})</div>
        {medList.length === 0 ? (
          <div className="empty-state">
            No medicines added yet. Click "Add Medicine" to get started.
          </div>
        ) : (
          <div className="med-list">
            {medList.map((med) => (
              <div className="med-item" key={med.id}>
                <div className="med-color-dot" style={{ background: med.colorHex }} />
                <div className="med-info">
                  <div className="med-name">{med.name}</div>
                  <div className="med-detail">
                    {med.dosage} · {med.form} · Compartment {med.compartmentNumber}
                    {' · '}
                    {med.doseTimes.join(', ')}
                    {' · '}
                    {med.scheduleDays.map((d) => DAYS[d]).join(', ')}
                  </div>
                </div>
                <div className="med-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEdit(med)}
                  >
                    ✏️ Edit
                  </button>
                  {deleteConfirm === med.id ? (
                    <>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(med.id)}>
                        Confirm Delete
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteConfirm(med.id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
