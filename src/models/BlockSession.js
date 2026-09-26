import mongoose from 'mongoose';

const blockSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['FOCUS', 'SCHEDULE', 'APP_LIMIT', 'MANUAL', 'STUDY_MODE', 'DOOMSCROLL'],
      required: true
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    endTime: {
      type: Date,
      default: null
    },
    strictMode: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true
    },
    sourceSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    blockedPackages: [
      {
        type: String
      }
    ],
    blockedDomains: [
      {
        type: String
      }
    ],
    interventionsCount: {
      type: Number,
      default: 0
    },
    interventions: [
      {
        packageIdentifier: { type: String },
        timestamp: { type: Date, default: Date.now },
        reflectionSeconds: { type: Number, default: 0 }
      }
    ]
  },
  {
    timestamps: true
  }
);

blockSessionSchema.index({ userId: 1, status: 1 });

export const BlockSession = mongoose.model('BlockSession', blockSessionSchema);
