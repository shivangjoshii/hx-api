export const calculateLevel = (totalXp) => {
  const safeXp = Math.max(0, Number(totalXp) || 0);
  const baseLevelXp = 100;
  const growthMultiplier = 1.2;

  let level = 1;
  let accumulatedXp = 0;
  let xpForNextLevel = baseLevelXp;

  while (safeXp >= accumulatedXp + xpForNextLevel) {
    accumulatedXp += xpForNextLevel;
    level += 1;
    xpForNextLevel = Math.round(baseLevelXp * Math.pow(growthMultiplier, level - 1));
  }

  const currentLevelXp = safeXp - accumulatedXp;

  return {
    level,
    totalXp: safeXp,
    currentLevelXp,
    xpRequiredForNextLevel: xpForNextLevel,
    progressPercentage: Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100))
  };
};

export const XP_VALUES = {
  FOCUS_SESSION_COMPLETED: 50,
  HABIT_COMPLETED: 20,
  SCHEDULE_COMPLETED: 30,
  STREAK_MAINTAINED: 100,
  ROOM_SESSION_COMPLETED: 75,
  CHALLENGE_COMPLETED: 150
};
