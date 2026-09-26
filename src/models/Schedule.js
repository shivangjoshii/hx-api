import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    days: [
      {
        type: Number,
        required: true
      }
    ],
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    focusType: {
      type: String,
      default: 'Study'
    },
    durationMinutes: {
      type: Number,
      default: 60
    },
    blockedApps: [
      {
        type: String
      }
    ],
    strictMode: {
      type: Boolean,
      default: false
    },
    recurring: {
      type: Boolean,
      default: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    completedSessionsCount: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

scheduleSchema.index({ userId: 1, enabled: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);
