import { ScreenTime } from '../models/ScreenTime.js';
import { FocusSession } from '../models/FocusSession.js';
import { HabitLog } from '../models/HabitLog.js';
import { Habit } from '../models/Habit.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { calculateDistractionScore, calculateFocusScore } from '../utils/scoreCalculator.js';

export const logDailyScreenTime = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      dateString,
      totalScreenTimeMinutes,
      productiveMinutes,
      distractedMinutes,
      neutralMinutes,
      appUsages,
      unplannedAppOpens,
      blockInterventions,
      interruptionsCount
    } = req.body;

    const targetDate = dateString || new Date().toISOString().split('T')[0];

    const distractionScore = calculateDistractionScore({
      unplannedAppOpens: unplannedAppOpens || 0,
      blockInterventions: blockInterventions || 0,
      screenTimeMinutes: totalScreenTimeMinutes || 0,
      targetScreenTimeMinutes: 240,
      interruptionsCount: interruptionsCount || 0
    });

    const [todaySessions, habits, habitLogs] = await Promise.all([
      FocusSession.find({ userId, status: 'completed' }),
      Habit.find({ userId, active: true }),
      HabitLog.find({ userId, dateString: targetDate, status: 'completed' })
    ]);

    const focusedMins = Math.round(todaySessions.reduce((acc, s) => acc + (s.actualDurationSeconds || 0), 0) / 60);

    const focusScore = calculateFocusScore({
      focusedMinutes: focusedMins,
      targetFocusMinutes: 120,
      completedSessions: todaySessions.length,
      completedHabitsCount: habitLogs.length,
      totalHabitsCount: habits.length || 1,
      scheduleAdherenceRate: 0.9
    });

    const record = await ScreenTime.findOneAndUpdate(
      { userId, dateString: targetDate },
      {
        $set: {
          totalScreenTimeMinutes: totalScreenTimeMinutes || 0,
          productiveMinutes: productiveMinutes || 0,
          distractedMinutes: distractedMinutes || 0,
          neutralMinutes: neutralMinutes || 0,
          timeReclaimedMinutes: Math.max(0, Math.round(focusedMins * 0.35)),
          appUsages: appUsages || [],
          distractionScore,
          focusScore
        }
      },
      { upsert: true, new: true }
    );

    return ApiResponse.success(res, { record }, 'Screen time recorded');
  } catch (error) {
    next(error);
  }
};

export const getDailyScreenTime = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    let record = await ScreenTime.findOne({ userId, dateString: targetDate });

    if (!record) {
      record = {
        dateString: targetDate,
        totalScreenTimeMinutes: 0,
        productiveMinutes: 0,
        distractedMinutes: 0,
        neutralMinutes: 0,
        timeReclaimedMinutes: 0,
        appUsages: [],
        distractionScore: 0,
        focusScore: 80
      };
    }

    return ApiResponse.success(res, { screenTime: record }, 'Daily screen time fetched');
  } catch (error) {
    next(error);
  }
};

export const getWeeklyScreenTime = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const records = await ScreenTime.find({ userId }).sort({ dateString: -1 }).limit(7);

    const reversed = [...records].reverse();

    const totalWeeklyMinutes = records.reduce((acc, r) => acc + r.totalScreenTimeMinutes, 0);
    const avgDailyMinutes = records.length > 0 ? Math.round(totalWeeklyMinutes / records.length) : 0;
    const totalReclaimed = records.reduce((acc, r) => acc + r.timeReclaimedMinutes, 0);

    return ApiResponse.success(
      res,
      {
        records: reversed,
        totalWeeklyMinutes,
        avgDailyMinutes,
        totalReclaimed
      },
      'Weekly screen time report'
    );
  } catch (error) {
    next(error);
  }
};
