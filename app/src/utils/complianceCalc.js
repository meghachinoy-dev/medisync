// Compliance rate calculations from dose log data

function countDayDosesMed(dayLogs, med) {
  let taken = 0;
  let total = 0;
  med.doseTimes.forEach((time) => {
    total++;
    const log = Object.values(dayLogs).find(
      (l) => l.medicineId === med.id && l.scheduledTime === time
    );
    if (log && log.status === 'taken') taken++;
  });
  return { taken, total };
}

function countDayDoses(dayLogs, medicines, dow) {
  let taken = 0;
  let total = 0;
  Object.values(medicines).forEach((med) => {
    if (!med.active || !med.scheduleDays.includes(dow)) return;
    med.doseTimes.forEach((time) => {
      total++;
      const log = Object.values(dayLogs).find(
        (l) => l.medicineId === med.id && l.scheduledTime === time
      );
      if (log && log.status === 'taken') taken++;
    });
  });
  return { taken, total };
}

export function calcOverallCompliance(doseLogs, medicines, days = 30) {
  let taken = 0;
  let total = 0;
  const today = new Date();

  for (let d = 1; d <= days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().split('T')[0];
    const dayLogs = doseLogs[dateKey] || {};
    const counts = countDayDoses(dayLogs, medicines, date.getDay());
    taken += counts.taken;
    total += counts.total;
  }

  return total === 0 ? 0 : Math.round((taken / total) * 100);
}

export function calcDailyCompliance(doseLogs, medicines, days = 30) {
  const result = [];
  const today = new Date();

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().split('T')[0];
    const dayLogs = doseLogs[dateKey] || {};
    const { taken, total } = countDayDoses(dayLogs, medicines, date.getDay());

    result.push({
      date: dateKey,
      label: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      taken,
      missed: total - taken,
      total,
      rate: total === 0 ? 0 : Math.round((taken / total) * 100),
    });
  }

  return result;
}

export function calcPerMedicineCompliance(doseLogs, medicines, days = 30) {
  const today = new Date();
  return Object.values(medicines).map((med) => {
    const acc = Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (i + 1));
      const dow = date.getDay();
      if (!med.scheduleDays.includes(dow)) return { taken: 0, total: 0 };
      const dateKey = date.toISOString().split('T')[0];
      const dayLogs = doseLogs[dateKey] || {};
      const counts = countDayDosesMed(dayLogs, med);
      return counts;
    });
    const total = acc.reduce((s, c) => s + c.total, 0);
    const taken = acc.reduce((s, c) => s + c.taken, 0);

    return {
      name: med.name,
      id: med.id,
      taken,
      missed: total - taken,
      total,
      rate: total === 0 ? 0 : Math.round((taken / total) * 100),
      color: med.colorHex,
    };
  });
}

export function calcMissedByHour(doseLogs, medicines, days = 30) {
  const hourCounts = Array(24).fill(0);
  const hourMisses = Array(24).fill(0);
  const today = new Date();

  for (let d = 1; d <= days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().split('T')[0];
    const dayLogs = doseLogs[dateKey] || {};
    const dow = date.getDay();

    Object.values(medicines).forEach((med) => {
      if (!med.active || !med.scheduleDays.includes(dow)) return;
      med.doseTimes.forEach((time) => {
        const hour = parseInt(time.split(':')[0], 10);
        const log = Object.values(dayLogs).find(
          (l) => l.medicineId === med.id && l.scheduledTime === time
        );
        hourCounts[hour]++;
        if (log && log.status === 'missed') hourMisses[hour]++;
      });
    });
  }

  return hourCounts.map((total, hour) => ({
    hour: `${String(hour).padStart(2, '0')}:00`,
    total,
    missed: hourMisses[hour],
    missRate: total === 0 ? 0 : Math.round((hourMisses[hour] / total) * 100),
  }));
}

export function calcDayOfWeekCompliance(doseLogs, medicines, days = 28) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts = Array(7).fill(0);
  const dayTaken = Array(7).fill(0);
  const today = new Date();

  for (let d = 1; d <= days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dow = date.getDay();
    const dateKey = date.toISOString().split('T')[0];
    const dayLogs = doseLogs[dateKey] || {};

    Object.values(medicines).forEach((med) => {
      if (!med.active || !med.scheduleDays.includes(dow)) return;
      med.doseTimes.forEach((time) => {
        dayCounts[dow]++;
        const log = Object.values(dayLogs).find(
          (l) => l.medicineId === med.id && l.scheduledTime === time
        );
        if (log && log.status === 'taken') dayTaken[dow]++;
      });
    });
  }

  return dayNames.map((name, idx) => ({
    day: name,
    taken: dayTaken[idx],
    missed: dayCounts[idx] - dayTaken[idx],
    total: dayCounts[idx],
    rate: dayCounts[idx] === 0 ? 0 : Math.round((dayTaken[idx] / dayCounts[idx]) * 100),
  }));
}

export function getTodayStats(schedule) {
  const taken = schedule.filter((s) => s.status === 'taken').length;
  const missed = schedule.filter((s) => s.status === 'missed').length;
  const pending = schedule.filter((s) => s.status === 'pending').length;
  const upcoming = schedule.filter((s) => s.status === 'upcoming').length;
  const total = schedule.length;
  const compliance = total > 0 ? Math.round(((taken) / (taken + missed)) * 100) || 0 : 0;
  return { taken, missed, pending, upcoming, total, compliance };
}
