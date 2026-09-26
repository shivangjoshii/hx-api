import { Achievement } from '../models/Achievement.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { XPTransaction } from '../models/XPTransaction.js';
import { Reward } from '../models/Reward.js';
import { User } from '../models/User.js';
import { FocusSession } from '../models/FocusSession.js';
import { Habit } from '../models/Habit.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { calculateLevel } from '../utils/levelCalculator.js';

const DEFAULT_ACHIEVEMENTS = [
  {
    code: 'FIRST_FOCUS',
    title: 'First Step',
    description: 'Complete your first focus session',
    category: 'focus',
    targetValue: 1,
    metricType: 'focus_sessions',
    xpReward: 50
  },
  {
    code: 'STREAK_7',
    title: 'Unstoppable Momentum',
    description: 'Maintain a 7-day focus streak',
    category: 'streak',
    targetValue: 7,
    metricType: 'streak_days',
    xpReward: 150
  },
  {
    code: 'STREAK_30',
    title: 'Master of Habit',
    description: 'Maintain a 30-day focus streak',
    category: 'streak',
    targetValue: 30,
    metricType: 'streak_days',
    xpReward: 500
  },
  {
    code: 'FOCUS_10_HOURS',
    title: 'Deep Thinker',
    description: 'Accumulate 10 hours of focused work',
    category: 'focus',
    targetValue: 600,
    metricType: 'focus_minutes',
    xpReward: 200
  },
  {
    code: 'FOCUS_50_HOURS',
    title: 'Architect of Time',
    description: 'Accumulate 50 hours of focused work',
    category: 'focus',
    targetValue: 3000,
    metricType: 'focus_minutes',
    xpReward: 600
  },
  {
    code: 'HABIT_CENTURION',
    title: 'Habit Centurion',
    description: 'Complete 100 habit check-ins',
    category: 'habits',
    targetValue: 100,
    metricType: 'habits_completed',
    xpReward: 300
  },
  {
    code: 'FIRST_GROUP_SESSION',
    title: 'Synchronized Mind',
    description: 'Complete a multiplayer focus room session',
    category: 'social',
    targetValue: 1,
    metricType: 'group_sessions',
    xpReward: 100
  }
];

export const getGamificationOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const levelInfo = calculateLevel(user.totalXp);

    const [recentXp, rewardsCount, achievementsCount] = await Promise.all([
      XPTransaction.find({ userId }).sort({ createdAt: -1 }).limit(10),
      Reward.countDocuments({ userId }),
      UserAchievement.countDocuments({ userId, isUnlocked: true })
    ]);

    return ApiResponse.success(
      res,
      {
        levelInfo,
        recentXp,
        streak: {
          current: user.streakCurrent,
          longest: user.streakLongest,
          freezes: user.streakFreezes
        },
        rewardsCount,
        achievementsCount
      },
      'Gamification overview fetched'
    );
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const count = await Achievement.countDocuments();
    if (count === 0) {
      await Achievement.insertMany(DEFAULT_ACHIEVEMENTS);
    }

    const [allAchievements, userAchievements, totalSessions, habitsCompleted] = await Promise.all([
      Achievement.find().sort({ targetValue: 1 }),
      UserAchievement.find({ userId }),
      FocusSession.find({ userId, status: 'completed' }),
      Habit.find({ userId })
    ]);

    const totalFocusMinutes = Math.round(totalSessions.reduce((acc, s) => acc + (s.actualDurationSeconds || 0), 0) / 60);
    const user = await User.findById(userId);

    const userAchMap = new Map();
    userAchievements.forEach((ua) => userAchMap.set(ua.achievementId.toString(), ua));

    const enrichedAchievements = allAchievements.map((ach) => {
      const userEntry = userAchMap.get(ach._id.toString());
      let currentMetric = 0;

      if (ach.metricType === 'focus_sessions') currentMetric = totalSessions.length;
      if (ach.metricType === 'focus_minutes') currentMetric = totalFocusMinutes;
      if (ach.metricType === 'streak_days') currentMetric = user.streakCurrent;
      if (ach.metricType === 'habits_completed') currentMetric = habitsCompleted.reduce((acc, h) => acc + h.totalCompletions, 0);

      const isUnlocked = userEntry?.isUnlocked || currentMetric >= ach.targetValue;
      const progress = Math.min(100, Math.round((currentMetric / ach.targetValue) * 100));

      return {
        id: ach._id,
        code: ach.code,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        targetValue: ach.targetValue,
        currentValue: currentMetric,
        progress,
        isUnlocked,
        xpReward: ach.xpReward,
        unlockedAt: userEntry?.unlockedAt || null
      };
    });

    return ApiResponse.success(res, { achievements: enrichedAchievements }, 'Achievements list');
  } catch (error) {
    next(error);
  }
};

export const getRewards = async (req, res, next) => {
  try {
    const rewards = await Reward.find({ userId: req.user._id }).sort({ costXp: 1 });
    return ApiResponse.success(res, { rewards }, 'Rewards fetched');
  } catch (error) {
    next(error);
  }
};

export const createReward = async (req, res, next) => {
  try {
    const { title, costXp, icon } = req.body;
    const reward = await Reward.create({
      userId: req.user._id,
      title,
      costXp: costXp || 100,
      icon: icon || 'gift'
    });
    return ApiResponse.created(res, { reward }, 'Reward created');
  } catch (error) {
    next(error);
  }
};

export const redeemReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reward = await Reward.findOne({ _id: id, userId });
    if (!reward) {
      throw ApiError.notFound('Reward not found');
    }

    const user = await User.findById(userId);
    if (user.totalXp < reward.costXp) {
      throw ApiError.badRequest(`Insufficient XP. You need ${reward.costXp} XP to redeem this reward.`);
    }

    user.totalXp -= reward.costXp;
    await user.save();

    reward.isRedeemed = true;
    reward.redeemedAt = new Date();
    await reward.save();

    await XPTransaction.create({
      userId,
      amount: -reward.costXp,
      type: 'SPENT',
      source: 'REWARD_REDEEM',
      referenceId: reward._id,
      description: `Redeemed reward: ${reward.title}`
    });

    return ApiResponse.success(res, { reward, remainingXp: user.totalXp }, 'Reward redeemed successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Reward.findOneAndDelete({ _id: id, userId: req.user._id });
    return ApiResponse.success(res, null, 'Reward deleted');
  } catch (error) {
    next(error);
  }
};
