import { User } from '../models/User.js';
import { FocusSession } from '../models/FocusSession.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const { type = 'global', timeframe = 'weekly' } = req.query;

    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate = new Date(0);
    }

    const focusAggregations = await FocusSession.aggregate([
      {
        $match: {
          status: 'completed',
          startedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalFocusSeconds: { $sum: '$actualDurationSeconds' },
          sessionsCompleted: { $sum: 1 }
        }
      },
      { $sort: { totalFocusSeconds: -1 } },
      { $limit: 100 }
    ]);

    const userIds = focusAggregations.map((a) => a._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name avatar totalXp level streakCurrent');

    const userMap = new Map();
    users.forEach((u) => userMap.set(u._id.toString(), u));

    const leaderboard = focusAggregations
      .map((item, index) => {
        const user = userMap.get(item._id.toString());
        if (!user) return null;
        return {
          rank: index + 1,
          userId: user._id,
          name: user.name,
          avatar: user.avatar,
          level: user.level,
          streakCurrent: user.streakCurrent,
          totalFocusMinutes: Math.round(item.totalFocusSeconds / 60),
          sessionsCompleted: item.sessionsCompleted,
          totalXp: user.totalXp
        };
      })
      .filter(Boolean);

    let myRank = null;
    if (req.user) {
      const myItemIndex = leaderboard.findIndex((entry) => entry.userId.toString() === req.user._id.toString());
      if (myItemIndex !== -1) {
        myRank = leaderboard[myItemIndex];
      } else {
        const myUser = await User.findById(req.user._id);
        myRank = {
          rank: '100+',
          userId: myUser._id,
          name: myUser.name,
          avatar: myUser.avatar,
          level: myUser.level,
          streakCurrent: myUser.streakCurrent,
          totalFocusMinutes: 0,
          sessionsCompleted: 0,
          totalXp: myUser.totalXp
        };
      }
    }

    return ApiResponse.success(res, { leaderboard, myRank, timeframe, type }, 'Leaderboard fetched');
  } catch (error) {
    next(error);
  }
};
