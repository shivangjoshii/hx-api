import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    reason: {
      type: String,
      default: '',
      trim: true
    },
    targetDate: {
      type: Date,
      default: null
    },
    targetFocusHours: {
      type: Number,
      default: 50
    },
    currentFocusMinutes: {
      type: Number,
      default: 0
    },
    linkedHabitIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
      }
    ],
    linkedCategories: [
      {
        type: String
      }
    ],
    progressPercentage: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'archived'],
      default: 'in_progress'
    },
    color: {
      type: String,
      default: '#9B7AF5'
    }
  },
  {
    timestamps: true
  }
);

goalSchema.index({ userId: 1, status: 1 });

export const Goal = mongoose.model('Goal', goalSchema);
