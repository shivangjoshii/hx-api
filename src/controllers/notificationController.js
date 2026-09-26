import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    return ApiResponse.success(
      res,
      {
        notifications,
        unreadCount,
        pagination: { page, limit, total }
      },
      'Notifications fetched'
    );
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    return ApiResponse.success(res, { notification }, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const triggerSmartNudge = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, body, type, metadata } = req.body;

    const notification = await Notification.create({
      userId,
      title: title || 'Smart Focus Nudge',
      body: body || 'You have free time before your next schedule. Start a quick 25-minute focus session?',
      type: type || 'SMART_NUDGE',
      metadata: metadata || {}
    });

    return ApiResponse.created(res, { notification }, 'Smart nudge delivered');
  } catch (error) {
    next(error);
  }
};
