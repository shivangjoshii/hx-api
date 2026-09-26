import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema(
  {
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    dateString: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['completed', 'skipped', 'failed', 'pending'],
      default: 'completed'
    },
    value: {
      type: Number,
      default: 1
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

habitLogSchema.index({ habitId: 1, dateString: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, dateString: 1 });

export const HabitLog = mongoose.model('HabitLog', habitLogSchema);
