import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    },
    isUnlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
