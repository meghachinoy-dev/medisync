// AI adaptive rule engine — pattern detection and schedule adaptation

const CONSECUTIVE_MISS_THRESHOLD = 3;
const COMPLIANCE_ALERT_THRESHOLD = 0.70;
const LOW_STOCK_THRESHOLD = 5;
const INTERACTION_WINDOW_MINUTES = 15;
const EARLY_TAKE_THRESHOLD_MINUTES = 10;

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Pattern 1: Consecutive miss — same medicine, same time slot, 3+ days in a row
function detectConsecutiveMiss(doseLogs, medicines) {
  const insights = [];
  const today = new Date();

  Object.values(medicines).forEach((med) => {
    med.doseTimes.forEach((time) => {
      let streak = 0;
      for (let d = 1; d <= 14; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateKey = date.toISOString().split('T')[0];
        const dayLogs = doseLogs[dateKey] || {};

        const log = Object.values(dayLogs).find(
          (l) => l.medicineId === med.id && l.scheduledTime === time
        );

        if (log && log.status === 'missed') {
          streak++;
        } else {
          break;
        }
      }

      if (streak >= CONSECUTIVE_MISS_THRESHOLD) {
        insights.push({
          type: 'CONSECUTIVE_MISS',
          severity: streak >= 5 ? 'critical' : 'warning',
          medicine: med,
          description: `${med.name} at ${time} has been missed for ${streak} consecutive days.`,
          suggestedAction: `Shift reminder ${Math.min(streak * 5, 30)} minutes earlier and increase buzzer duration.`,
          autoApply: true,
          confidence: Math.min(0.6 + streak * 0.1, 0.98),
          shiftMinutes: Math.min(streak * 5, 30),
          affectedTime: time,
          streakLength: streak,
        });
      }
    });
  });

  return insights;
}

// Pattern 2: Day-of-week pattern — missed on specific days ≥ 3 of last 4 occurrences
function detectDayOfWeekPattern(doseLogs, medicines) {
  const insights = [];
  const today = new Date();

  Object.values(medicines).forEach((med) => {
    const dayMissCounts = Array(7).fill(0);
    const dayTotalCounts = Array(7).fill(0);

    for (let d = 1; d <= 28; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dow = date.getDay();
      if (!med.scheduleDays.includes(dow)) continue;

      const dateKey = date.toISOString().split('T')[0];
      const dayLogs = doseLogs[dateKey] || {};

      med.doseTimes.forEach((time) => {
        const log = Object.values(dayLogs).find(
          (l) => l.medicineId === med.id && l.scheduledTime === time
        );
        if (log) {
          dayTotalCounts[dow]++;
          if (log.status === 'missed') dayMissCounts[dow]++;
        }
      });
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayMissCounts.forEach((misses, dow) => {
      const total = dayTotalCounts[dow];
      if (total >= 3 && misses / total >= 0.65) {
        insights.push({
          type: 'DAY_OF_WEEK',
          severity: 'warning',
          medicine: med,
          description: `${med.name} is missed on ${dayNames[dow]}s — ${Math.round((misses / total) * 100)}% miss rate over last 4 weeks.`,
          suggestedAction: `Add secondary reminder 30 minutes earlier on ${dayNames[dow]}s.`,
          autoApply: true,
          confidence: Math.min(0.5 + (misses / total) * 0.5, 0.95),
          shiftMinutes: 30,
          affectedDay: dow,
          missRate: misses / total,
        });
      }
    });
  });

  return insights;
}

// Pattern 3: Low stock detection
function detectLowStock(compartments, medicines) {
  const insights = [];

  Object.entries(compartments).forEach(([compNum, comp]) => {
    if (!comp.medicineId) return;
    const med = medicines[comp.medicineId];
    if (!med) return;

    if (comp.pillsRemaining <= LOW_STOCK_THRESHOLD && comp.pillsRemaining > 0) {
      insights.push({
        type: 'LOW_STOCK',
        severity: 'warning',
        medicine: med,
        description: `${med.name} (compartment ${compNum}) has only ${comp.pillsRemaining} pill(s) remaining.`,
        suggestedAction: 'Generate REFILL alert to caregiver immediately.',
        autoApply: true,
        confidence: 1.0,
        compartment: Number(compNum),
        pillsRemaining: comp.pillsRemaining,
      });
    } else if (comp.pillsRemaining === 0 && comp.status !== 'UNASSIGNED') {
      insights.push({
        type: 'EMPTY_COMPARTMENT',
        severity: 'critical',
        medicine: med,
        description: `${med.name} (compartment ${compNum}) is EMPTY. Doses cannot be dispensed.`,
        suggestedAction: 'Refill compartment immediately and notify caregiver.',
        autoApply: true,
        confidence: 1.0,
        compartment: Number(compNum),
        pillsRemaining: 0,
      });
    }
  });

  return insights;
}

// Pattern 4: 7-day rolling compliance below threshold
function detectComplianceThreshold(doseLogs, medicines) {
  const insights = [];
  const today = new Date();

  Object.values(medicines).forEach((med) => {
    const counts = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (i + 1));
      const dow = date.getDay();
      if (!med.scheduleDays.includes(dow)) return { taken: 0, total: 0 };
      const dateKey = date.toISOString().split('T')[0];
      const dayLogs = doseLogs[dateKey] || {};
      let t = 0;
      let tk = 0;
      med.doseTimes.forEach((time) => {
        t++;
        const log = Object.values(dayLogs).find(
          (l) => l.medicineId === med.id && l.scheduledTime === time
        );
        if (log && log.status === 'taken') tk++;
      });
      return { taken: tk, total: t };
    });
    const total = counts.reduce((s, c) => s + c.total, 0);
    const taken = counts.reduce((s, c) => s + c.taken, 0);

    if (total > 0 && taken / total < COMPLIANCE_ALERT_THRESHOLD) {
      const rate = taken / total;
      insights.push({
        type: 'COMPLIANCE_THRESHOLD',
        severity: rate < 0.5 ? 'critical' : 'warning',
        medicine: med,
        description: `${med.name} 7-day compliance is ${Math.round(rate * 100)}% — below the 70% threshold.`,
        suggestedAction: 'Generate DOCTOR_NOTIFY alert and escalate to caregiver.',
        autoApply: true,
        confidence: 0.95,
        complianceRate: rate,
        takenCount: taken,
        totalCount: total,
      });
    }
  });

  return insights;
}

// Pattern 5: Consistently taken early — suggest shifting schedule earlier
function detectEarlyTakePattern(doseLogs, medicines) {
  const insights = [];
  const today = new Date();

  Object.values(medicines).forEach((med) => {
    med.doseTimes.forEach((scheduledTime) => {
      const scheduledMin = timeToMinutes(scheduledTime);
      const earlyDeltas = [];

      for (let d = 1; d <= 21; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateKey = date.toISOString().split('T')[0];
        const dayLogs = doseLogs[dateKey] || {};

        const log = Object.values(dayLogs).find(
          (l) => l.medicineId === med.id && l.scheduledTime === scheduledTime && l.status === 'taken'
        );
        if (log && log.actualTime) {
          const actualMin = timeToMinutes(log.actualTime);
          const delta = scheduledMin - actualMin;
          if (delta >= EARLY_TAKE_THRESHOLD_MINUTES) earlyDeltas.push(delta);
        }
      }

      if (earlyDeltas.length >= 5) {
        const avgEarly = Math.round(earlyDeltas.reduce((a, b) => a + b, 0) / earlyDeltas.length);
        insights.push({
          type: 'EARLY_TAKE_PATTERN',
          severity: 'info',
          medicine: med,
          description: `${med.name} is consistently taken ~${avgEarly} min before the scheduled ${scheduledTime} time.`,
          suggestedAction: `Shift schedule to ${minutesToTime(scheduledMin - avgEarly)} for better alignment.`,
          autoApply: false,
          confidence: Math.min(0.5 + earlyDeltas.length * 0.05, 0.9),
          shiftMinutes: -avgEarly,
          affectedTime: scheduledTime,
          sampleCount: earlyDeltas.length,
        });
      }
    });
  });

  return insights;
}

// Pattern 6: Two medicines scheduled within 15 min of each other
function detectInteractionWindow(medicines) {
  const insights = [];
  const medList = Object.values(medicines).filter((m) => m.active);

  for (let i = 0; i < medList.length; i++) {
    for (let j = i + 1; j < medList.length; j++) {
      const medA = medList[i];
      const medB = medList[j];

      const sharedDays = medA.scheduleDays.filter((d) => medB.scheduleDays.includes(d));
      if (sharedDays.length === 0) continue;

      medA.doseTimes.forEach((timeA) => {
        medB.doseTimes.forEach((timeB) => {
          const diff = Math.abs(timeToMinutes(timeA) - timeToMinutes(timeB));
          if (diff <= INTERACTION_WINDOW_MINUTES && diff > 0) {
            insights.push({
              type: 'INTERACTION_WINDOW',
              severity: 'info',
              medicine: medA,
              medicinePair: [medA, medB],
              description: `${medA.name} (${timeA}) and ${medB.name} (${timeB}) are scheduled only ${diff} min apart.`,
              suggestedAction: 'Stagger doses by at least 30 minutes to reduce confusion.',
              autoApply: false,
              confidence: 0.88,
              timeDiffMinutes: diff,
            });
          }
        });
      });
    }
  }

  return insights;
}

// Main engine — run all patterns and return deduplicated insights
export function runAIEngine(doseLogs, medicines, compartments) {
  if (!doseLogs || !medicines) return [];

  const allInsights = [
    ...detectConsecutiveMiss(doseLogs, medicines),
    ...detectDayOfWeekPattern(doseLogs, medicines),
    ...detectLowStock(compartments || {}, medicines),
    ...detectComplianceThreshold(doseLogs, medicines),
    ...detectEarlyTakePattern(doseLogs, medicines),
    ...detectInteractionWindow(medicines),
  ];

  // Sort by severity: critical > warning > info, then by confidence
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return allInsights.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    return b.confidence - a.confidence;
  });
}

// Build the set of adaptive rules to push to Firebase
export function buildAdaptiveRules(insights) {
  return insights
    .filter((i) => i.autoApply)
    .map((insight, idx) => ({
      id: `rule_${Date.now()}_${idx}`,
      patternType: insight.type,
      medicineId: insight.medicine?.id || null,
      detectedAt: Date.now(),
      action: insight.type === 'CONSECUTIVE_MISS' ? 'SHIFT_REMINDER_EARLIER'
        : insight.type === 'DAY_OF_WEEK' ? 'ADD_SECONDARY_REMINDER'
        : insight.type === 'LOW_STOCK' ? 'GENERATE_REFILL_ALERT'
        : insight.type === 'EMPTY_COMPARTMENT' ? 'GENERATE_REFILL_ALERT'
        : insight.type === 'COMPLIANCE_THRESHOLD' ? 'GENERATE_DOCTOR_NOTIFY'
        : 'LOG_ONLY',
      applied: false,
      shiftMinutes: insight.shiftMinutes || 0,
      confidence: insight.confidence,
    }));
}
