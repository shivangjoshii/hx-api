export const calculateDistractionScore = ({
  unplannedAppOpens = 0,
  blockInterventions = 0,
  screenTimeMinutes = 0,
  targetScreenTimeMinutes = 240,
  interruptionsCount = 0
}) => {
  let score = 0;
  score += Math.min(30, blockInterventions * 5);
  score += Math.min(25, unplannedAppOpens * 2);
  score += Math.min(25, interruptionsCount * 4);

  if (screenTimeMinutes > targetScreenTimeMinutes) {
    const excessMinutes = screenTimeMinutes - targetScreenTimeMinutes;
    score += Math.min(20, Math.round(excessMinutes / 10));
  }

  return Math.min(100, Math.max(0, Math.round(score)));
};

export const calculateFocusScore = ({
  focusedMinutes = 0,
  targetFocusMinutes = 120,
  completedSessions = 0,
  completedHabitsCount = 0,
  totalHabitsCount = 1,
  scheduleAdherenceRate = 1
}) => {
  const focusRatio = targetFocusMinutes > 0 ? Math.min(1.2, focusedMinutes / targetFocusMinutes) : 0;
  const focusWeight = Math.min(45, Math.round(focusRatio * 45));

  const habitRatio = totalHabitsCount > 0 ? Math.min(1, completedHabitsCount / totalHabitsCount) : 1;
  const habitWeight = Math.round(habitRatio * 30);

  const sessionWeight = Math.min(15, completedSessions * 5);
  const adherenceWeight = Math.round(scheduleAdherenceRate * 10);

  const total = focusWeight + habitWeight + sessionWeight + adherenceWeight;
  return Math.min(100, Math.max(0, Math.round(total)));
};

export const calculateTimeReclaimed = (pastAverageDistractionMinutes, currentDistractionMinutes) => {
  const diff = pastAverageDistractionMinutes - currentDistractionMinutes;
  return Math.max(0, diff);
};
