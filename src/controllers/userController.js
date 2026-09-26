import { User } from '../models/User.js';
import { FocusSession } from '../models/FocusSession.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { Goal } from '../models/Goal.js';
import { Schedule } from '../models/Schedule.js';
import { AppRule } from '../models/AppRule.js';
import { WebsiteRule } from '../models/WebsiteRule.js';
import { ScreenTime } from '../models/ScreenTime.js';
import { XPTransaction } from '../models/XPTransaction.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { Reward } from '../models/Reward.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { calculateLevel } from '../utils/levelCalculator.js';
import { cloudinary } from '../config/cloudinary.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const levelInfo = calculateLevel(user.totalXp);

    return ApiResponse.success(
      res,
      {
        user,
        levelInfo
      },
      'User profile fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    return ApiResponse.success(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadAvatarImage = async (req, res, next) => {
  try {
    let avatarUrl = '';

    if (req.file && req.file.path) {
      avatarUrl = req.file.path;
    } else if (req.file && req.file.buffer) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: 'habitx/avatars',
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face'
      });
      avatarUrl = uploadRes.secure_url;
    } else if (req.body.avatarBase64) {
      const uploadRes = await cloudinary.uploader.upload(req.body.avatarBase64, {
        folder: 'habitx/avatars',
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face'
      });
      avatarUrl = uploadRes.secure_url;
    }

    if (!avatarUrl) {
      throw ApiError.badRequest('No image file provided');
    }

    const user = await User.findById(req.user._id);
    user.avatar = avatarUrl;
    await user.save();

    return ApiResponse.success(res, { avatar: avatarUrl }, 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.preferences = {
      ...user.preferences.toObject(),
      ...req.body
    };

    await user.save();

    return ApiResponse.success(res, { preferences: user.preferences }, 'Preferences updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateOnboarding = async (req, res, next) => {
  try {
    const { goals, distractions, focusTargetMinutes, bestFocusTime } = req.body;
    const user = await User.findById(req.user._id);

    user.onboarding = {
      completed: true,
      goals: goals || user.onboarding.goals,
      distractions: distractions || user.onboarding.distractions,
      focusTargetMinutes: focusTargetMinutes || user.onboarding.focusTargetMinutes,
      bestFocusTime: bestFocusTime || user.onboarding.bestFocusTime
    };

    await user.save();

    return ApiResponse.success(res, { onboarding: user.onboarding }, 'Onboarding saved successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user.isGuest) {
      user.password = newPassword;
      user.isGuest = false;
      await user.save();
      return ApiResponse.success(res, null, 'Password set successfully');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect current password');
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

export const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      user,
      focusSessions,
      habits,
      habitLogs,
      goals,
      schedules,
      appRules,
      websiteRules,
      screenTime,
      xpTransactions,
      achievements,
      rewards
    ] = await Promise.all([
      User.findById(userId).select('-password'),
      FocusSession.find({ userId }).sort({ startedAt: -1 }),
      Habit.find({ userId }),
      HabitLog.find({ userId }),
      Goal.find({ userId }),
      Schedule.find({ userId }),
      AppRule.find({ userId }),
      WebsiteRule.find({ userId }),
      ScreenTime.find({ userId }).sort({ dateString: -1 }),
      XPTransaction.find({ userId }).sort({ createdAt: -1 }),
      UserAchievement.find({ userId }).populate('achievementId'),
      Reward.find({ userId })
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      user,
      focusSessions,
      habits,
      habitLogs,
      goals,
      schedules,
      appRules,
      websiteRules,
      screenTime,
      xpTransactions,
      achievements,
      rewards
    };

    return ApiResponse.success(res, exportBundle, 'User data exported successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      User.findByIdAndDelete(userId),
      FocusSession.deleteMany({ userId }),
      Habit.deleteMany({ userId }),
      HabitLog.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      Schedule.deleteMany({ userId }),
      AppRule.deleteMany({ userId }),
      WebsiteRule.deleteMany({ userId }),
      ScreenTime.deleteMany({ userId }),
      XPTransaction.deleteMany({ userId }),
      UserAchievement.deleteMany({ userId }),
      Reward.deleteMany({ userId })
    ]);

    return ApiResponse.success(res, null, 'Account and associated data deleted permanently');
  } catch (error) {
    next(error);
  }
};
