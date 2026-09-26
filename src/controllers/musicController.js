import { MusicTrack } from '../models/MusicTrack.js';
import { ApiResponse } from '../utils/apiResponse.js';

const DEFAULT_TRACKS = [
  {
    title: 'Gentle Rain on Leaves',
    category: 'Rain',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1255/1255-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 1
  },
  {
    title: 'Deep Pine Forest',
    category: 'Forest',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1247/1247-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 2
  },
  {
    title: 'Calm Ocean Waves',
    category: 'Ocean',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1195/1195-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 3
  },
  {
    title: 'Quiet Parisian Cafe',
    category: 'Cafe',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1258/1258-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 4
  },
  {
    title: 'Pure White Noise',
    category: 'White Noise',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1250/1250-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 5
  },
  {
    title: 'Midnight Lo-Fi Beats',
    category: 'Lo-fi',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1240/1240-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 6
  },
  {
    title: 'Ambient Space Drone',
    category: 'Ambient',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1244/1244-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 7
  },
  {
    title: 'Alpha Waves 10Hz',
    category: 'Binaural',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1248/1248-preview.mp3',
    durationSeconds: 1800,
    isPremium: false,
    order: 8
  }
];

export const getMusicTracks = async (req, res, next) => {
  try {
    const count = await MusicTrack.countDocuments();
    if (count === 0) {
      await MusicTrack.insertMany(DEFAULT_TRACKS);
    }

    const tracks = await MusicTrack.find().sort({ order: 1 });
    const categories = ['Rain', 'Forest', 'Ocean', 'Cafe', 'White Noise', 'Lo-fi', 'Ambient', 'Binaural'];

    return ApiResponse.success(res, { tracks, categories }, 'Focus music tracks fetched');
  } catch (error) {
    next(error);
  }
};
