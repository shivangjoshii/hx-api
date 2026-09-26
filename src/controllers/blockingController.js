import { AppRule } from '../models/AppRule.js';
import { WebsiteRule } from '../models/WebsiteRule.js';
import { BlockSession } from '../models/BlockSession.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getAppRules = async (req, res, next) => {
  try {
    const rules = await AppRule.find({ userId: req.user._id }).sort({ displayName: 1 });
    return ApiResponse.success(res, { rules }, 'App rules fetched');
  } catch (error) {
    next(error);
  }
};

export const syncAppRules = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
      throw ApiError.badRequest('Rules must be an array');
    }

    const bulkOps = rules.map((r) => ({
      updateOne: {
        filter: { userId, packageIdentifier: r.packageIdentifier },
        update: {
          $set: {
            displayName: r.displayName || r.packageIdentifier,
            category: r.category || 'Social',
            classification: r.classification || 'Distracting',
            mode: r.mode || 'focus_only',
            dailyLimitMinutes: r.dailyLimitMinutes || 0,
            warningThresholdMinutes: r.warningThresholdMinutes || 10,
            emergencyOverrideMinutes: r.emergencyOverrideMinutes || 5,
            enabled: r.enabled !== undefined ? r.enabled : true,
            strict: r.strict || false
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await AppRule.bulkWrite(bulkOps);
    }

    const updatedRules = await AppRule.find({ userId });
    return ApiResponse.success(res, { rules: updatedRules }, 'App rules synced successfully');
  } catch (error) {
    next(error);
  }
};

export const saveAppRule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { packageIdentifier, displayName, category, classification, mode, dailyLimitMinutes, warningThresholdMinutes, enabled, strict } = req.body;

    const rule = await AppRule.findOneAndUpdate(
      { userId, packageIdentifier },
      {
        $set: {
          displayName,
          category: category || 'Social',
          classification: classification || 'Distracting',
          mode: mode || 'focus_only',
          dailyLimitMinutes: dailyLimitMinutes || 0,
          warningThresholdMinutes: warningThresholdMinutes || 10,
          enabled: enabled !== undefined ? enabled : true,
          strict: strict || false
        }
      },
      { upsert: true, new: true }
    );

    return ApiResponse.success(res, { rule }, 'App rule saved');
  } catch (error) {
    next(error);
  }
};

export const deleteAppRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await AppRule.findOneAndDelete({ _id: id, userId: req.user._id });
    return ApiResponse.success(res, null, 'App rule deleted');
  } catch (error) {
    next(error);
  }
};

export const getWebsiteRules = async (req, res, next) => {
  try {
    const rules = await WebsiteRule.find({ userId: req.user._id }).sort({ domain: 1 });
    return ApiResponse.success(res, { rules }, 'Website rules fetched');
  } catch (error) {
    next(error);
  }
};

export const saveWebsiteRule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { domain, type, category, mode, enabled, strict } = req.body;

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const rule = await WebsiteRule.findOneAndUpdate(
      { userId, domain: cleanDomain },
      {
        $set: {
          type: type || 'BLOCK',
          category: category || 'Custom',
          mode: mode || 'focus_only',
          enabled: enabled !== undefined ? enabled : true,
          strict: strict || false
        }
      },
      { upsert: true, new: true }
    );

    return ApiResponse.success(res, { rule }, 'Website rule saved');
  } catch (error) {
    next(error);
  }
};

export const deleteWebsiteRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await WebsiteRule.findOneAndDelete({ _id: id, userId: req.user._id });
    return ApiResponse.success(res, null, 'Website rule deleted');
  } catch (error) {
    next(error);
  }
};

export const getActiveBlockSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const activeSession = await BlockSession.findOne({
      userId,
      status: 'active'
    });

    const user = await User.findById(userId);
    const doomscroll = user?.preferences?.doomscrollProtection || {};

    const appRules = await AppRule.find({ userId, enabled: true });
    const websiteRules = await WebsiteRule.find({ userId, enabled: true });

    return ApiResponse.success(
      res,
      {
        activeBlockSession: activeSession,
        doomscrollProtection: doomscroll,
        alwaysBlockedApps: appRules.filter((r) => r.mode === 'always_blocked').map((r) => r.packageIdentifier),
        appLimits: appRules.filter((r) => r.mode === 'daily_limit'),
        websiteRules
      },
      'Active blocking rules fetched'
    );
  } catch (error) {
    next(error);
  }
};

export const recordIntervention = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { packageIdentifier, reflectionSeconds } = req.body;

    const activeSession = await BlockSession.findOne({
      userId,
      status: 'active'
    });

    if (activeSession) {
      activeSession.interventionsCount += 1;
      activeSession.interventions.push({
        packageIdentifier,
        timestamp: new Date(),
        reflectionSeconds: reflectionSeconds || 0
      });
      await activeSession.save();
    }

    return ApiResponse.success(res, { interventionsCount: activeSession ? activeSession.interventionsCount : 1 }, 'Intervention recorded');
  } catch (error) {
    next(error);
  }
};
