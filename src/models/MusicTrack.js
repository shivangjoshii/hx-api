import mongoose from 'mongoose';

const musicTrackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Rain', 'Forest', 'Ocean', 'Cafe', 'White Noise', 'Lo-fi', 'Ambient', 'Binaural'],
      required: true
    },
    audioUrl: {
      type: String,
      required: true
    },
    durationSeconds: {
      type: Number,
      default: 1800
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const MusicTrack = mongoose.model('MusicTrack', musicTrackSchema);
