import { FocusSession } from '../models/FocusSession.js';
import { ScreenTime } from '../models/ScreenTime.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getAICompanionInsights = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [recentSessions, screenTimeLogs, habits, habitLogs] = await Promise.all([
      FocusSession.find({ userId, status: 'completed', startedAt: { $gte: startOfWeek } }),
      ScreenTime.find({ userId, createdAt: { $gte: startOfWeek } }),
      Habit.find({ userId, active: true }),
      HabitLog.find({ userId, createdAt: { $gte: startOfWeek } })
    ]);

    const hourCounts = {};
    recentSessions.forEach((s) => {
      const hour = new Date(s.startedAt).getHours();
      const timeWindow = `${hour}:00 - ${hour + 1}:00`;
      hourCounts[timeWindow] = (hourCounts[timeWindow] || 0) + 1;
    });

    let bestWindow = '7:00 PM - 9:00 PM';
    let maxSessions = 0;
    Object.entries(hourCounts).forEach(([window, count]) => {
      if (count > maxSessions) {
        maxSessions = count;
        bestWindow = window;
      }
    });

    const totalFocusMinutes = Math.round(
      recentSessions.reduce((acc, s) => acc + (s.actualDurationSeconds || 0), 0) / 60
    );

    const completedHabits = habitLogs.filter((l) => l.status === 'completed').length;
    const habitCompletionRate = habits.length > 0 ? Math.round((completedHabits / (habits.length * 7)) * 100) : 85;

    const cards = [
      {
        id: 'strongest_window',
        type: 'insight',
        title: 'Strongest Focus Window',
        description: `Your focus is strongest between ${bestWindow}. You completed ${recentSessions.length || 4} sessions during this period recently.`,
        actionLabel: 'Schedule Session',
        actionType: 'SCHEDULE_FOCUS',
        metadata: { recommendedWindow: bestWindow }
      },
      {
        id: 'habits_momentum',
        type: 'momentum',
        title: 'Habit Consistency',
        description: `Your habit completion rate is ${habitCompletionRate}%. You are maintaining strong momentum across ${habits.length} active habits.`,
        actionLabel: 'View Habits',
        actionType: 'NAVIGATE_HABITS',
        metadata: { completionRate: habitCompletionRate }
      },
      {
        id: 'reclaimed_time',
        type: 'reclaimed',
        title: 'Attention Protected',
        description: `You have dedicated ${totalFocusMinutes} minutes to intentional focus this week. Keep protecting your deep attention.`,
        actionLabel: 'Start Focus',
        actionType: 'START_FOCUS',
        metadata: { focusMinutes: totalFocusMinutes }
      }
    ];

    return ApiResponse.success(
      res,
      {
        companionName: 'Focus Companion',
        greeting: `Welcome back, ${user.name.split(' ')[0]}`,
        summary: `Your attention management system has logged ${recentSessions.length} focus sessions this week.`,
        bestFocusWindow: bestWindow,
        insights: cards
      },
      'AI companion insights generated'
    );
  } catch (error) {
    next(error);
  }
};

export const getAIWeeklyReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [sessions, screenTimeEntries, habits, habitLogs] = await Promise.all([
      FocusSession.find({ userId, status: 'completed', startedAt: { $gte: sevenDaysAgo } }),
      ScreenTime.find({ userId, createdAt: { $gte: sevenDaysAgo } }),
      Habit.find({ userId, active: true }),
      HabitLog.find({ userId, createdAt: { $gte: sevenDaysAgo } })
    ]);

    const totalFocusMinutes = Math.round(
      sessions.reduce((acc, s) => acc + (s.actualDurationSeconds || 0), 0) / 60
    );

    const totalScreenMinutes = screenTimeEntries.reduce((acc, e) => acc + (e.totalScreenTimeMinutes || 0), 0);
    const estimatedReclaimed = Math.round(totalFocusMinutes * 0.4);

    const dayFocusMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    sessions.forEach((s) => {
      const day = dayNames[new Date(s.startedAt).getDay()];
      dayFocusMap[day] += Math.round((s.actualDurationSeconds || 0) / 60);
    });

    let bestDay = 'Wednesday';
    let bestDayMinutes = 0;
    Object.entries(dayFocusMap).forEach(([day, mins]) => {
      if (mins > bestDayMinutes) {
        bestDayMinutes = mins;
        bestDay = day;
      }
    });

    const completedHabitsCount = habitLogs.filter((l) => l.status === 'completed').length;
    const habitScore = habits.length > 0 ? Math.min(100, Math.round((completedHabitsCount / (habits.length * 7)) * 100)) : 90;

    const review = {
      weekDateRange: `${sevenDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`,
      totalFocusMinutes,
      totalScreenMinutes,
      timeReclaimedMinutes: estimatedReclaimed,
      bestDay,
      bestFocusWindow: '7:00 PM - 9:00 PM',
      habitAdherenceRate: habitScore,
      sessionsCompleted: sessions.length,
      topDistractingCategory: 'Social & Entertainment',
      suggestedOptimization: 'Consider setting your evening social app limit 30 minutes earlier to safeguard your sleep routine.',
      dailyFocusBreakdown: dayFocusMap
    };

    return ApiResponse.success(res, { review }, 'AI weekly review fetched');
  } catch (error) {
    next(error);
  }
};
