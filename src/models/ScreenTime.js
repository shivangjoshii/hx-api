import mongoose from 'mongoose';

const appUsageSchema = new mongoose.Schema(
  {
    packageIdentifier: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: 'Other'
    },
    classification: {
      type: String,
      enum: ['Productive', 'Distracting', 'Neutral', 'Ignore'],
      default: 'Distracting'
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    openCount: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const screenTimeSchema = new mongoose.Schema(
  {
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
    totalScreenTimeMinutes: {
      type: Number,
      default: 0
    },
    productiveMinutes: {
      type: Number,
      default: 0
    },
    distractedMinutes: {
      type: Number,
      default: 0
    },
    neutralMinutes: {
      type: Number,
      default: 0
    },
    timeReclaimedMinutes: {
      type: Number,
      default: 0
    },
    appUsages: [appUsageSchema],
    distractionScore: {
      type: Number,
      default: 0
    },
    focusScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

screenTimeSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export const ScreenTime = mongoose.model('ScreenTime', screenTimeSchema);
