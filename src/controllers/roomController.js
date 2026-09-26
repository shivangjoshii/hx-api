import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const getPublicRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: 'active', isPublic: true })
      .populate('hostUserId', 'name avatar')
      .sort({ 'activeParticipants.length': -1, createdAt: -1 })
      .limit(30);

    const totalActiveUsers = rooms.reduce((acc, r) => acc + r.activeParticipants.length, 0);

    return ApiResponse.success(res, { rooms, totalActiveUsers }, 'Public focus rooms fetched');
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, category, durationMinutes, isPublic, maxParticipants, leaderboardEnabled } = req.body;

    const user = await User.findById(userId);
    let roomCode = generateRoomCode();
    let exists = await Room.findOne({ roomCode, status: 'active' });
    while (exists) {
      roomCode = generateRoomCode();
      exists = await Room.findOne({ roomCode, status: 'active' });
    }

    const room = await Room.create({
      roomCode,
      name,
      category: category || 'Study',
      hostUserId: userId,
      durationMinutes: durationMinutes || 45,
      isPublic: isPublic !== undefined ? isPublic : true,
      maxParticipants: maxParticipants || 50,
      leaderboardEnabled: leaderboardEnabled !== undefined ? leaderboardEnabled : true,
      activeParticipants: [
        {
          userId,
          name: user.name,
          avatar: user.avatar,
          joinedAt: new Date(),
          focusedMinutes: 0,
          status: 'focusing'
        }
      ]
    });

    return ApiResponse.created(res, { room }, 'Focus room created successfully');
  } catch (error) {
    next(error);
  }
};

export const getRoomByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ roomCode: code.toUpperCase(), status: 'active' })
      .populate('hostUserId', 'name avatar')
      .populate('activeParticipants.userId', 'name avatar level');

    if (!room) {
      throw ApiError.notFound('Room not found or session has ended');
    }

    return ApiResponse.success(res, { room }, 'Room details fetched');
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);

    const room = await Room.findOne({ roomCode: code.toUpperCase(), status: 'active' });
    if (!room) {
      throw ApiError.notFound('Room not found or has concluded');
    }

    if (room.activeParticipants.length >= room.maxParticipants) {
      throw ApiError.badRequest('Room is already at maximum participant capacity');
    }

    const existingIndex = room.activeParticipants.findIndex((p) => p.userId.toString() === userId.toString());
    if (existingIndex === -1) {
      room.activeParticipants.push({
        userId,
        name: user.name,
        avatar: user.avatar,
        joinedAt: new Date(),
        focusedMinutes: 0,
        status: 'focusing'
      });
      await room.save();
    }

    return ApiResponse.success(res, { room }, 'Joined room successfully');
  } catch (error) {
    next(error);
  }
};

export const leaveRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomCode: code.toUpperCase() });
    if (!room) {
      throw ApiError.notFound('Room not found');
    }

    room.activeParticipants = room.activeParticipants.filter((p) => p.userId.toString() !== userId.toString());

    if (room.activeParticipants.length === 0) {
      room.status = 'ended';
    }

    await room.save();

    return ApiResponse.success(res, null, 'Left room successfully');
  } catch (error) {
    next(error);
  }
};

export const endRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomCode: code.toUpperCase() });
    if (!room) {
      throw ApiError.notFound('Room not found');
    }

    if (room.hostUserId.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the room host can end the focus room');
    }

    room.status = 'ended';
    room.activeParticipants = [];
    await room.save();

    return ApiResponse.success(res, null, 'Focus room concluded');
  } catch (error) {
    next(error);
  }
};
