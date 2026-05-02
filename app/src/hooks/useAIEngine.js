import { useMemo, useEffect } from 'react';
import { runAIEngine, buildAdaptiveRules } from '../utils/aiEngine';

export function useAIEngine(doseLogs, medicines, compartments, pushAIRule) {
  const insights = useMemo(() => {
    if (!doseLogs || !medicines) return [];
    return runAIEngine(doseLogs, medicines, compartments);
  }, [doseLogs, medicines, compartments]);

  const adaptiveRules = useMemo(() => {
    return buildAdaptiveRules(insights);
  }, [insights]);

  // Auto-push high-confidence critical rules to Firebase
  useEffect(() => {
    if (!pushAIRule) return;
    adaptiveRules
      .filter((r) => r.confidence >= 0.9 && !r.applied)
      .forEach((rule) => {
        pushAIRule({ ...rule, applied: true });
      });
  }, [adaptiveRules, pushAIRule]);

  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount = insights.filter((i) => i.severity === 'warning').length;

  return { insights, adaptiveRules, criticalCount, warningCount };
}
