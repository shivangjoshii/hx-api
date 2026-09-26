import { Schedule } from '../models/Schedule.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id }).sort({ startTime: 1 });
    return ApiResponse.success(res, { schedules }, 'Schedules fetched');
  } catch (error) {
    next(error);
  }
};

export const createSchedule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, days, startTime, endTime, focusType, durationMinutes, blockedApps, strictMode, recurring } = req.body;

    const schedule = await Schedule.create({
      userId,
      name,
      days: days || [1, 2, 3, 4, 5],
      startTime,
      endTime,
      focusType: focusType || 'Study',
      durationMinutes: durationMinutes || 60,
      blockedApps: blockedApps || [],
      strictMode: strictMode || false,
      recurring: recurring !== undefined ? recurring : true
    });

    return ApiResponse.created(res, { schedule }, 'Schedule created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!schedule) {
      throw ApiError.notFound('Schedule not found');
    }

    return ApiResponse.success(res, { schedule }, 'Schedule updated');
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Schedule.findOneAndDelete({ _id: id, userId: req.user._id });
    return ApiResponse.success(res, null, 'Schedule deleted');
  } catch (error) {
    next(error);
  }
};

export const getUpcomingSchedule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentDay = now.getDay();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const schedules = await Schedule.find({
      userId,
      enabled: true,
      days: currentDay
    }).sort({ startTime: 1 });

    const upcoming = schedules.find((s) => s.startTime >= currentTimeStr) || schedules[0] || null;

    return ApiResponse.success(res, { upcomingSchedule: upcoming }, 'Upcoming schedule fetched');
  } catch (error) {
    next(error);
  }
};
