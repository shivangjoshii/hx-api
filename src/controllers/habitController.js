import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { User } from '../models/User.js';
import { XPTransaction } from '../models/XPTransaction.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { XP_VALUES } from '../utils/levelCalculator.js';

export const getHabits = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const todayStr = req.query.date || new Date().toISOString().split('T')[0];

    const [habits, todayLogs] = await Promise.all([
      Habit.find({ userId, active: true }).sort({ order: 1, createdAt: 1 }),
      HabitLog.find({ userId, dateString: todayStr })
    ]);

    const logMap = new Map();
    todayLogs.forEach((log) => {
      logMap.set(log.habitId.toString(), log);
    });

    const habitsWithStatus = habits.map((habit) => {
      const log = logMap.get(habit._id.toString());
      return {
        ...habit.toObject(),
        todayStatus: log ? log.status : 'pending',
        todayValue: log ? log.value : 0,
        todayLogId: log ? log._id : null
      };
    });

    return ApiResponse.success(res, { habits: habitsWithStatus, date: todayStr }, 'Habits fetched');
  } catch (error) {
    next(error);
  }
};

export const createHabit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, description, type, target, unit, frequency, frequencyDays, reminderTime, goalId, color, icon } = req.body;

    const count = await Habit.countDocuments({ userId });

    const habit = await Habit.create({
      userId,
      name,
      description: description || '',
      type: type || 'boolean',
      target: target || 1,
      unit: unit || 'times',
      frequency: frequency || 'everyday',
      frequencyDays: frequencyDays || [],
      reminderTime: reminderTime || '',
      goalId: goalId || null,
      color: color || '#9B7AF5',
      icon: icon || 'tick_circle',
      order: count
    });

    return ApiResponse.created(res, { habit }, 'Habit created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!habit) {
      throw ApiError.notFound('Habit not found');
    }

    return ApiResponse.success(res, { habit }, 'Habit updated');
  } catch (error) {
    next(error);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!habit) {
      throw ApiError.notFound('Habit not found');
    }

    await HabitLog.deleteMany({ habitId: id });

    return ApiResponse.success(res, null, 'Habit deleted');
  } catch (error) {
    next(error);
  }
};

export const logHabit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { dateString, status, value, notes } = req.body;

    const targetDate = dateString || new Date().toISOString().split('T')[0];
    const habit = await Habit.findOne({ _id: id, userId });

    if (!habit) {
      throw ApiError.notFound('Habit not found');
    }

    const log = await HabitLog.findOneAndUpdate(
      { habitId: habit._id, dateString: targetDate },
      {
        $set: {
          userId,
          status: status || 'completed',
          value: value !== undefined ? value : habit.target,
          notes: notes || ''
        }
      },
      { upsert: true, new: true }
    );

    if (log.status === 'completed') {
      habit.totalCompletions += 1;
      habit.currentStreak += 1;
      if (habit.currentStreak > habit.longestStreak) {
        habit.longestStreak = habit.currentStreak;
      }
      await habit.save();

      const user = await User.findById(userId);
      user.totalXp += XP_VALUES.HABIT_COMPLETED;
      await user.save();

      await XPTransaction.create({
        userId,
        amount: XP_VALUES.HABIT_COMPLETED,
        type: 'EARNED',
        source: 'HABIT',
        referenceId: habit._id,
        description: `Completed habit: ${habit.name}`
      });
    }

    return ApiResponse.success(res, { log, habit }, 'Habit logged successfully');
  } catch (error) {
    next(error);
  }
};

export const getHabitLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const habit = await Habit.findOne({ _id: id, userId: req.user._id });
    if (!habit) {
      throw ApiError.notFound('Habit not found');
    }

    let query = { habitId: id, userId: req.user._id };
    if (year && month) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      query.dateString = { $regex: `^${monthPrefix}` };
    }

    const logs = await HabitLog.find(query).sort({ dateString: 1 });

    return ApiResponse.success(res, { habit, logs }, 'Habit calendar logs fetched');
  } catch (error) {
    next(error);
  }
};
