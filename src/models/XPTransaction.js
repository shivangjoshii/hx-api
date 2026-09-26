import mongoose from 'mongoose';

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['EARNED', 'SPENT'],
      required: true
    },
    source: {
      type: String,
      enum: ['FOCUS_SESSION', 'HABIT', 'SCHEDULE', 'STREAK', 'ACHIEVEMENT', 'REWARD_REDEEM', 'BONUS', 'ROOM_FOCUS'],
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    description: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

xpTransactionSchema.index({ userId: 1, createdAt: -1 });

export const XPTransaction = mongoose.model('XPTransaction', xpTransactionSchema);
