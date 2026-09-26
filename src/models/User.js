import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: function () {
        return !this.isGuest && !this.googleId && !this.appleId;
      }
    },
    avatar: {
      type: String,
      default: ''
    },
    isGuest: {
      type: Boolean,
      default: false
    },
    googleId: {
      type: String,
      sparse: true
    },
    appleId: {
      type: String,
      sparse: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    verificationOtp: {
      type: String,
      default: null
    },
    verificationOtpExpiresAt: {
      type: Date,
      default: null
    },
    resetPasswordOtp: {
      type: String,
      default: null
    },
    resetPasswordOtpExpiresAt: {
      type: Date,
      default: null
    },
    totalXp: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    streakCurrent: {
      type: Number,
      default: 0
    },
    streakLongest: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: String,
      default: null
    },
    streakFreezes: {
      type: Number,
      default: 1
    },
    onboarding: {
      completed: { type: Boolean, default: false },
      goals: [{ type: String }],
      distractions: [{ type: String }],
      focusTargetMinutes: { type: Number, default: 120 },
      bestFocusTime: { type: String, default: 'Evening' }
    },
    preferences: {
      theme: {
        type: String,
        enum: ['system', 'light', 'dark', 'midnight', 'lavender_night', 'mono', 'aurora', 'forest', 'ocean'],
        default: 'system'
      },
      defaultFocusDuration: { type: Number, default: 25 },
      defaultBreakDuration: { type: Number, default: 5 },
      defaultLongBreakDuration: { type: Number, default: 15 },
      autoStartBreak: { type: Boolean, default: false },
      autoStartNextSession: { type: Boolean, default: false },
      soundEnabled: { type: Boolean, default: true },
      soundPreset: { type: String, default: 'Rain' },
      strictModeDefault: { type: Boolean, default: false },
      doomscrollProtection: {
        instagramReels: { type: Boolean, default: true },
        youtubeShorts: { type: Boolean, default: true },
        facebookReels: { type: Boolean, default: true },
        snapchatSpotlight: { type: Boolean, default: true }
      },
      notifications: {
        focusReminders: { type: Boolean, default: true },
        habitReminders: { type: Boolean, default: true },
        streakReminders: { type: Boolean, default: true },
        smartNudges: { type: Boolean, default: true },
        weeklyReview: { type: Boolean, default: true }
      }
    },
    isPro: {
      type: Boolean,
      default: false
    },
    proExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
