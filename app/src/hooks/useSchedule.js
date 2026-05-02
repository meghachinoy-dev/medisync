import { useMemo } from 'react';
import { buildTodaySchedule, buildWeekSchedule, applyDoseLogStatus } from '../utils/scheduleBuilder';

export function useSchedule(medicines, doseLogs, aiRules) {
  const todayKey = new Date().toISOString().split('T')[0];

  const todaySchedule = useMemo(() => {
    const aiRuleList = Object.values(aiRules || {});
    const raw = buildTodaySchedule(medicines || {}, aiRuleList);
    return applyDoseLogStatus(raw, doseLogs || {}, todayKey);
  }, [medicines, doseLogs, aiRules, todayKey]);

  const weekSchedule = useMemo(() => {
    return buildWeekSchedule(medicines || {});
  }, [medicines]);

  return { todaySchedule, weekSchedule, todayKey };
}
