import mongoose from 'mongoose';

const roomParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: ''
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    focusedMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['focusing', 'break', 'idle'],
      default: 'focusing'
    },
    socketId: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'Study',
      trim: true
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    durationMinutes: {
      type: Number,
      default: 45
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true
    },
    maxParticipants: {
      type: Number,
      default: 50
    },
    leaderboardEnabled: {
      type: Boolean,
      default: true
    },
    activeParticipants: [roomParticipantSchema],
    totalFocusMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Room = mongoose.model('Room', roomSchema);
