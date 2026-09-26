import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: 'award'
    },
    category: {
      type: String,
      enum: ['focus', 'streak', 'habits', 'reclaimed', 'social', 'special'],
      default: 'focus'
    },
    targetValue: {
      type: Number,
      required: true
    },
    metricType: {
      type: String,
      enum: ['focus_minutes', 'focus_sessions', 'streak_days', 'habits_completed', 'time_reclaimed_minutes', 'group_sessions'],
      required: true
    },
    xpReward: {
      type: Number,
      default: 100
    }
  },
  {
    timestamps: true
  }
);

export const Achievement = mongoose.model('Achievement', achievementSchema);
