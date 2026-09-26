import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
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
    costXp: {
      type: Number,
      required: true,
      min: 10
    },
    icon: {
      type: String,
      default: 'gift'
    },
    isRedeemed: {
      type: Boolean,
      default: false
    },
    redeemedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

rewardSchema.index({ userId: 1, isRedeemed: 1 });

export const Reward = mongoose.model('Reward', rewardSchema);
