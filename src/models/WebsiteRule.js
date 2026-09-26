import mongoose from 'mongoose';

const websiteRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    domain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['BLOCK', 'ALLOW'],
      default: 'BLOCK'
    },
    category: {
      type: String,
      enum: ['Social', 'Entertainment', 'Adult', 'Shopping', 'News', 'Custom', 'Study'],
      default: 'Custom'
    },
    mode: {
      type: String,
      enum: ['always', 'focus_only', 'study_mode', 'scheduled'],
      default: 'focus_only'
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

websiteRuleSchema.index({ userId: 1, domain: 1 }, { unique: true });

export const WebsiteRule = mongoose.model('WebsiteRule', websiteRuleSchema);
