// Alert and notification generation logic

export function generateAlerts(insights, existingAlerts = {}) {
  const newAlerts = [];

  insights.forEach((insight) => {
    if (!insight.autoApply) return;

    const alreadyExists = Object.values(existingAlerts).some(
      (a) =>
        !a.read &&
        a.medicineId === insight.medicine?.id &&
        a.type === mapInsightTypeToAlertType(insight.type)
    );
    if (alreadyExists) return;

    newAlerts.push({
      type: mapInsightTypeToAlertType(insight.type),
      severity: insight.severity,
      message: buildAlertMessage(insight),
      medicineId: insight.medicine?.id || null,
      compartment: insight.compartment || insight.medicine?.compartmentNumber || null,
      createdAt: Date.now(),
      read: false,
      sentToCaregiver: insight.severity === 'critical',
    });
  });

  return newAlerts;
}

function mapInsightTypeToAlertType(insightType) {
  const map = {
    CONSECUTIVE_MISS: 'MISSED_DOSE',
    DAY_OF_WEEK: 'MISSED_DOSE',
    LOW_STOCK: 'LOW_STOCK',
    EMPTY_COMPARTMENT: 'EMPTY',
    COMPLIANCE_THRESHOLD: 'DOCTOR_NOTIFY',
    EARLY_TAKE_PATTERN: 'INFO',
    INTERACTION_WINDOW: 'INFO',
  };
  return map[insightType] || 'INFO';
}

function buildAlertMessage(insight) {
  switch (insight.type) {
    case 'CONSECUTIVE_MISS':
      return `${insight.medicine.name} has been missed for ${insight.streakLength} consecutive days at ${insight.affectedTime}. Reminder shifted ${insight.shiftMinutes} min earlier.`;
    case 'DAY_OF_WEEK':
      return `${insight.medicine.name} shows a recurring miss pattern. Extra reminder added 30 min before scheduled time.`;
    case 'LOW_STOCK':
      return `${insight.medicine.name} in compartment ${insight.compartment} has only ${insight.pillsRemaining} pill(s) left. Please refill.`;
    case 'EMPTY_COMPARTMENT':
      return `${insight.medicine.name} in compartment ${insight.compartment} is EMPTY. Doses cannot be dispensed.`;
    case 'COMPLIANCE_THRESHOLD':
      return `${insight.medicine.name} 7-day compliance is ${Math.round(insight.complianceRate * 100)}% — below the 70% threshold. Doctor notification recommended.`;
    default:
      return insight.description;
  }
}

export function formatAlertTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export const ALERT_COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const ALERT_ICONS = {
  MISSED_DOSE: '💊',
  LOW_STOCK: '⚠️',
  EMPTY: '🚨',
  DOCTOR_NOTIFY: '🏥',
  INFO: 'ℹ️',
};
