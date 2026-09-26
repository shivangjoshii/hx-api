import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'Focus Session',
      trim: true
    },
    category: {
      type: String,
      default: 'Study',
      trim: true
    },
    mode: {
      type: String,
      enum: ['timer', 'pomodoro', 'stopwatch', 'deep_work', 'study_mode', 'digital_detox', 'sleep_mode'],
      default: 'timer'
    },
    plannedDurationMinutes: {
      type: Number,
      default: 25
    },
    actualDurationSeconds: {
      type: Number,
      default: 0
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    pausedDurationSeconds: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['running', 'paused', 'completed', 'abandoned'],
      default: 'running',
      index: true
    },
    strictMode: {
      type: Boolean,
      default: false
    },
    blockedApps: [
      {
        type: String
      }
    ],
    blockedAppsCount: {
      type: Number,
      default: 0
    },
    interruptionsCount: {
      type: Number,
      default: 0
    },
    soundTrack: {
      type: String,
      default: 'None'
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      default: null
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null
    },
    pomodoroRoundsTotal: {
      type: Number,
      default: 1
    },
    pomodoroRoundsCompleted: {
      type: Number,
      default: 0
    },
    xpEarned: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

focusSessionSchema.index({ userId: 1, startedAt: -1 });

export const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
