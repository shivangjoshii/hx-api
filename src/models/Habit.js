import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['boolean', 'duration', 'quantity', 'count', 'negative'],
      default: 'boolean'
    },
    target: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      default: 'times',
      trim: true
    },
    frequency: {
      type: String,
      enum: ['everyday', 'weekdays', 'weekends', 'specific_days', 'weekly', 'custom'],
      default: 'everyday'
    },
    frequencyDays: [
      {
        type: Number
      }
    ],
    reminderTime: {
      type: String,
      default: ''
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null
    },
    color: {
      type: String,
      default: '#9B7AF5'
    },
    icon: {
      type: String,
      default: 'tick_circle'
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

habitSchema.index({ userId: 1, active: 1, order: 1 });

export const Habit = mongoose.model('Habit', habitSchema);
