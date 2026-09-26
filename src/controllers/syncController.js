import { FocusSession } from '../models/FocusSession.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { Goal } from '../models/Goal.js';
import { Schedule } from '../models/Schedule.js';
import { AppRule } from '../models/AppRule.js';
import { WebsiteRule } from '../models/WebsiteRule.js';
import { ScreenTime } from '../models/ScreenTime.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const batchSync = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      focusSessions = [],
      habits = [],
      habitLogs = [],
      goals = [],
      schedules = [],
      appRules = [],
      websiteRules = [],
      screenTime = []
    } = req.body;

    const results = {
      focusSessionsSynced: 0,
      habitsSynced: 0,
      habitLogsSynced: 0,
      goalsSynced: 0,
      schedulesSynced: 0,
      appRulesSynced: 0,
      websiteRulesSynced: 0,
      screenTimeSynced: 0
    };

    if (focusSessions.length > 0) {
      for (const session of focusSessions) {
        await FocusSession.findOneAndUpdate(
          { userId, _id: session.id || session._id },
          {
            $set: {
              ...session,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.focusSessionsSynced = focusSessions.length;
    }

    if (habits.length > 0) {
      for (const habit of habits) {
        await Habit.findOneAndUpdate(
          { userId, _id: habit.id || habit._id },
          {
            $set: {
              ...habit,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.habitsSynced = habits.length;
    }

    if (habitLogs.length > 0) {
      for (const log of habitLogs) {
        await HabitLog.findOneAndUpdate(
          { userId, habitId: log.habitId, dateString: log.dateString },
          {
            $set: {
              ...log,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.habitLogsSynced = habitLogs.length;
    }

    if (goals.length > 0) {
      for (const goal of goals) {
        await Goal.findOneAndUpdate(
          { userId, _id: goal.id || goal._id },
          {
            $set: {
              ...goal,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.goalsSynced = goals.length;
    }

    if (schedules.length > 0) {
      for (const schedule of schedules) {
        await Schedule.findOneAndUpdate(
          { userId, _id: schedule.id || schedule._id },
          {
            $set: {
              ...schedule,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.schedulesSynced = schedules.length;
    }

    if (appRules.length > 0) {
      for (const rule of appRules) {
        await AppRule.findOneAndUpdate(
          { userId, packageIdentifier: rule.packageIdentifier },
          {
            $set: {
              ...rule,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.appRulesSynced = appRules.length;
    }

    if (websiteRules.length > 0) {
      for (const rule of websiteRules) {
        await WebsiteRule.findOneAndUpdate(
          { userId, domain: rule.domain },
          {
            $set: {
              ...rule,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.websiteRulesSynced = websiteRules.length;
    }

    if (screenTime.length > 0) {
      for (const st of screenTime) {
        await ScreenTime.findOneAndUpdate(
          { userId, dateString: st.dateString },
          {
            $set: {
              ...st,
              userId
            }
          },
          { upsert: true }
        );
      }
      results.screenTimeSynced = screenTime.length;
    }

    const user = await User.findById(userId).select('-password');

    return ApiResponse.success(
      res,
      {
        syncStatus: 'COMPLETED',
        syncedAt: new Date().toISOString(),
        summary: results,
        user
      },
      'Batch offline synchronization completed'
    );
  } catch (error) {
    next(error);
  }
};
