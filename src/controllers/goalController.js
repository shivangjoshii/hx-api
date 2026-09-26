import { Goal } from '../models/Goal.js';
import { Habit } from '../models/Habit.js';
import { FocusSession } from '../models/FocusSession.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id, status: { $ne: 'archived' } })
      .populate('linkedHabitIds')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, { goals }, 'Goals fetched');
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, description, reason, targetDate, targetFocusHours, linkedHabitIds, linkedCategories, color } = req.body;

    const goal = await Goal.create({
      userId,
      title,
      description: description || '',
      reason: reason || '',
      targetDate: targetDate || null,
      targetFocusHours: targetFocusHours || 50,
      linkedHabitIds: linkedHabitIds || [],
      linkedCategories: linkedCategories || [],
      color: color || '#9B7AF5'
    });

    return ApiResponse.created(res, { goal }, 'Goal created successfully');
  } catch (error) {
    next(error);
  }
};

export const getGoalDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({ _id: id, userId: req.user._id }).populate('linkedHabitIds');

    if (!goal) {
      throw ApiError.notFound('Goal not found');
    }

    const sessions = await FocusSession.find({
      userId: req.user._id,
      goalId: id,
      status: 'completed'
    }).sort({ startedAt: -1 }).limit(10);

    return ApiResponse.success(res, { goal, recentSessions: sessions }, 'Goal details fetched');
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!goal) {
      throw ApiError.notFound('Goal not found');
    }

    return ApiResponse.success(res, { goal }, 'Goal updated');
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Goal.findOneAndDelete({ _id: id, userId: req.user._id });
    return ApiResponse.success(res, null, 'Goal deleted');
  } catch (error) {
    next(error);
  }
};
