// Builds the daily dose schedule from medicine configurations

export function buildTodaySchedule(medicines, aiRules = []) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dateKey = today.toISOString().split('T')[0];
  const slots = [];

  Object.values(medicines).forEach((med) => {
    if (!med.active) return;
    if (!med.scheduleDays.includes(dayOfWeek)) return;

    med.doseTimes.forEach((time) => {
      // Apply AI rule time shifts if present
      let adaptedTime = time;
      const rule = aiRules.find(
        (r) => r.medicineId === med.id && r.patternType === 'CONSECUTIVE_MISS' && r.applied
      );
      if (rule && rule.shiftMinutes) {
        const [h, m] = time.split(':').map(Number);
        const totalMin = h * 60 + m - rule.shiftMinutes;
        const adjH = Math.floor(totalMin / 60) % 24;
        const adjM = totalMin % 60;
        adaptedTime = `${String(Math.max(adjH, 0)).padStart(2, '0')}:${String(Math.max(adjM, 0)).padStart(2, '0')}`;
      }

      const [h, m] = adaptedTime.split(':').map(Number);
      const scheduledDate = new Date(today);
      scheduledDate.setHours(h, m, 0, 0);

      const now = new Date();
      let status = 'upcoming';
      if (scheduledDate < now) {
        const diffMs = now - scheduledDate;
        status = diffMs < 3600000 ? 'pending' : 'upcoming';
      }

      slots.push({
        id: `${med.id}_${time}`,
        medicineId: med.id,
        medicine: med,
        scheduledTime: time,
        adaptedTime,
        isAdapted: adaptedTime !== time,
        compartmentNumber: med.compartmentNumber,
        status,
        dateKey,
        sortKey: adaptedTime,
      });
    });
  });

  return slots.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function buildWeekSchedule(medicines) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const week = {};

  dayNames.forEach((day, idx) => {
    week[day] = [];
    Object.values(medicines).forEach((med) => {
      if (!med.active || !med.scheduleDays.includes(idx)) return;
      med.doseTimes.forEach((time) => {
        week[day].push({ medicine: med, time });
      });
    });
    week[day].sort((a, b) => a.time.localeCompare(b.time));
  });

  return week;
}

export function applyDoseLogStatus(schedule, doseLogs, dateKey) {
  const logs = doseLogs[dateKey] || {};
  return schedule.map((slot) => {
    const log = Object.values(logs).find(
      (l) => l.medicineId === slot.medicineId && l.scheduledTime === slot.scheduledTime
    );
    if (log) return { ...slot, status: log.status, log };
    return slot;
  });
}
