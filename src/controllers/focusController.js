import { FocusSession } from '../models/FocusSession.js';
import { BlockSession } from '../models/BlockSession.js';
import { User } from '../models/User.js';
import { Goal } from '../models/Goal.js';
import { XPTransaction } from '../models/XPTransaction.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { XP_VALUES } from '../utils/levelCalculator.js';

export const startFocusSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      title,
      category,
      mode,
      plannedDurationMinutes,
      strictMode,
      blockedApps,
      soundTrack,
      scheduleId,
      goalId,
      pomodoroRoundsTotal
    } = req.body;

    const existingRunning = await FocusSession.findOne({
      userId,
      status: { $in: ['running', 'paused'] }
    });

    if (existingRunning) {
      return ApiResponse.success(res, { session: existingRunning }, 'Recovered active focus session');
    }

    const session = await FocusSession.create({
      userId,
      title: title || 'Focus Session',
      category: category || 'Study',
      mode: mode || 'timer',
      plannedDurationMinutes: plannedDurationMinutes || 25,
      strictMode: strictMode || false,
      blockedApps: blockedApps || [],
      blockedAppsCount: (blockedApps || []).length,
      soundTrack: soundTrack || 'None',
      scheduleId: scheduleId || null,
      goalId: goalId || null,
      pomodoroRoundsTotal: pomodoroRoundsTotal || 1,
      startedAt: new Date(),
      status: 'running'
    });

    if (blockedApps && blockedApps.length > 0) {
      await BlockSession.create({
        userId,
        type: 'FOCUS',
        startTime: session.startedAt,
        strictMode: session.strictMode,
        sourceSessionId: session._id,
        blockedPackages: blockedApps,
        status: 'active'
      });
    }

    return ApiResponse.created(res, { session }, 'Focus session started');
  } catch (error) {
    next(error);
  }
};

export const getActiveFocusSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const session = await FocusSession.findOne({
      userId,
      status: { $in: ['running', 'paused'] }
    });

    return ApiResponse.success(res, { session }, 'Active session status');
  } catch (error) {
    next(error);
  }
};

export const pauseFocusSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await FocusSession.findOne({ _id: id, userId: req.user._id });

    if (!session) {
      throw ApiError.notFound('Focus session not found');
    }

    if (session.status !== 'running') {
      throw ApiError.badRequest('Session is not in a running state');
    }

    if (session.strictMode) {
      throw ApiError.forbidden('Cannot pause session in Strict Mode');
    }

    session.status = 'paused';
    await session.save();

    return ApiResponse.success(res, { session }, 'Focus session paused');
  } catch (error) {
    next(error);
  }
};

export const resumeFocusSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await FocusSession.findOne({ _id: id, userId: req.user._id });

    if (!session) {
      throw ApiError.notFound('Focus session not found');
    }

    if (session.status !== 'paused') {
      throw ApiError.badRequest('Session is not paused');
    }

    session.status = 'running';
    await session.save();

    return ApiResponse.success(res, { session }, 'Focus session resumed');
  } catch (error) {
    next(error);
  }
};

export const finishFocusSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualDurationSeconds, interruptionsCount, pomodoroRoundsCompleted, notes } = req.body;

    const session = await FocusSession.findOne({ _id: id, userId: req.user._id });

    if (!session) {
      throw ApiError.notFound('Focus session not found');
    }

    const calculatedSeconds = actualDurationSeconds !== undefined
      ? actualDurationSeconds
      : Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000) - (session.pausedDurationSeconds || 0));

    session.actualDurationSeconds = calculatedSeconds;
    session.endedAt = new Date();
    session.status = 'completed';
    session.interruptionsCount = interruptionsCount || session.interruptionsCount;
    session.pomodoroRoundsCompleted = pomodoroRoundsCompleted || session.pomodoroRoundsCompleted;
    if (notes) session.notes = notes;

    let xpEarned = XP_VALUES.FOCUS_SESSION_COMPLETED;
    if (session.strictMode) xpEarned += 20;
    if (calculatedSeconds >= 45 * 60) xpEarned += 25;
    session.xpEarned = xpEarned;

    await session.save();

    await BlockSession.updateMany(
      { sourceSessionId: session._id, status: 'active' },
      { status: 'completed', endTime: session.endedAt }
    );

    const user = await User.findById(req.user._id);
    user.totalXp += xpEarned;

    const todayStr = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (user.lastActiveDate === yesterdayStr) {
        user.streakCurrent += 1;
      } else {
        user.streakCurrent = 1;
      }

      if (user.streakCurrent > user.streakLongest) {
        user.streakLongest = user.streakCurrent;
      }
      user.lastActiveDate = todayStr;
    }

    await user.save();

    await XPTransaction.create({
      userId: user._id,
      amount: xpEarned,
      type: 'EARNED',
      source: 'FOCUS_SESSION',
      referenceId: session._id,
      description: `Completed ${session.title} (${Math.round(calculatedSeconds / 60)} min)`
    });

    if (session.goalId) {
      const goal = await Goal.findOne({ _id: session.goalId, userId: user._id });
      if (goal) {
        goal.currentFocusMinutes += Math.round(calculatedSeconds / 60);
        const targetMinutes = goal.targetFocusHours * 60;
        goal.progressPercentage = targetMinutes > 0 ? Math.min(100, Math.round((goal.currentFocusMinutes / targetMinutes) * 100)) : 100;
        await goal.save();
      }
    }

    return ApiResponse.success(
      res,
      {
        session,
        xpEarned,
        userStats: {
          totalXp: user.totalXp,
          streakCurrent: user.streakCurrent,
          streakLongest: user.streakLongest
        }
      },
      'Focus session completed successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const abandonFocusSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await FocusSession.findOne({ _id: id, userId: req.user._id });

    if (!session) {
      throw ApiError.notFound('Focus session not found');
    }

    if (session.strictMode && session.status === 'running') {
      throw ApiError.forbidden('Strict Mode active. Session cannot be abandoned prematurely.');
    }

    session.status = 'abandoned';
    session.endedAt = new Date();
    await session.save();

    await BlockSession.updateMany(
      { sourceSessionId: session._id, status: 'active' },
      { status: 'cancelled', endTime: session.endedAt }
    );

    return ApiResponse.success(res, { session }, 'Focus session ended early');
  } catch (error) {
    next(error);
  }
};

export const getFocusHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const query = { userId, status: 'completed' };
    if (req.query.category) query.category = req.query.category;
    if (req.query.mode) query.mode = req.query.mode;

    const [sessions, total] = await Promise.all([
      FocusSession.find(query).sort({ startedAt: -1 }).skip(skip).limit(limit),
      FocusSession.countDocuments(query)
    ]);

    return ApiResponse.success(
      res,
      {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      'Focus history fetched'
    );
  } catch (error) {
    next(error);
  }
};

export const getFocusSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [todaySessions, weekSessions, totalSessions] = await Promise.all([
      FocusSession.find({ userId, status: 'completed', startedAt: { $gte: startOfToday } }),
      FocusSession.find({ userId, status: 'completed', startedAt: { $gte: startOfWeek } }),
      FocusSession.countDocuments({ userId, status: 'completed' })
    ]);

    const todaySeconds = todaySessions.reduce((acc, curr) => acc + (curr.actualDurationSeconds || 0), 0);
    const weekSeconds = weekSessions.reduce((acc, curr) => acc + (curr.actualDurationSeconds || 0), 0);

    const todayMinutes = Math.round(todaySeconds / 60);
    const weekMinutes = Math.round(weekSeconds / 60);

    const user = await User.findById(userId);
    const dailyTargetMinutes = user?.onboarding?.focusTargetMinutes || 120;
    const goalPercentage = dailyTargetMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyTargetMinutes) * 100)) : 0;

    const estimatedReclaimedMinutes = Math.round(weekMinutes * 0.35);

    return ApiResponse.success(
      res,
      {
        today: {
          minutes: todayMinutes,
          sessionsCount: todaySessions.length,
          targetMinutes: dailyTargetMinutes,
          goalPercentage
        },
        week: {
          minutes: weekMinutes,
          sessionsCount: weekSessions.length,
          timeReclaimedMinutes: estimatedReclaimedMinutes
        },
        totalCompletedSessions: totalSessions,
        streak: {
          current: user?.streakCurrent || 0,
          longest: user?.streakLongest || 0
        }
      },
      'Focus summary calculated'
    );
  } catch (error) {
    next(error);
  }
};
