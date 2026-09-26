import mongoose from 'mongoose';

const appRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    packageIdentifier: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    iconUrl: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['Social', 'Entertainment', 'Games', 'Shopping', 'Productive', 'Neutral', 'Other'],
      default: 'Social'
    },
    classification: {
      type: String,
      enum: ['Productive', 'Distracting', 'Neutral', 'Ignore'],
      default: 'Distracting'
    },
    mode: {
      type: String,
      enum: ['focus_only', 'scheduled', 'daily_limit', 'always_blocked', 'study_mode'],
      default: 'focus_only'
    },
    dailyLimitMinutes: {
      type: Number,
      default: 0
    },
    warningThresholdMinutes: {
      type: Number,
      default: 10
    },
    emergencyOverrideMinutes: {
      type: Number,
      default: 5
    },
    enabled: {
      type: Boolean,
      default: true
    },
    strict: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

appRuleSchema.index({ userId: 1, packageIdentifier: 1 }, { unique: true });

export const AppRule = mongoose.model('AppRule', appRuleSchema);
