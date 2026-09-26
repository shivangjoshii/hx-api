import { Router } from 'express';
import Joi from 'joi';
import {
  getAppRules,
  syncAppRules,
  saveAppRule,
  deleteAppRule,
  getWebsiteRules,
  saveWebsiteRule,
  deleteWebsiteRule,
  getActiveBlockSession,
  recordIntervention
} from '../controllers/blockingController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const saveAppRuleSchema = Joi.object({
  packageIdentifier: Joi.string().required(),
  displayName: Joi.string().required(),
  category: Joi.string().valid('Social', 'Entertainment', 'Games', 'Shopping', 'Productive', 'Neutral', 'Other'),
  classification: Joi.string().valid('Productive', 'Distracting', 'Neutral', 'Ignore'),
  mode: Joi.string().valid('focus_only', 'scheduled', 'daily_limit', 'always_blocked', 'study_mode'),
  dailyLimitMinutes: Joi.number().min(0),
  warningThresholdMinutes: Joi.number().min(1),
  emergencyOverrideMinutes: Joi.number().min(0),
  enabled: Joi.boolean(),
  strict: Joi.boolean()
});

const saveWebsiteRuleSchema = Joi.object({
  domain: Joi.string().required(),
  type: Joi.string().valid('BLOCK', 'ALLOW'),
  category: Joi.string().valid('Social', 'Entertainment', 'Adult', 'Shopping', 'News', 'Custom', 'Study'),
  mode: Joi.string().valid('always', 'focus_only', 'study_mode', 'scheduled'),
  enabled: Joi.boolean(),
  strict: Joi.boolean()
});

const recordInterventionSchema = Joi.object({
  packageIdentifier: Joi.string().required(),
  reflectionSeconds: Joi.number().min(0)
});

router.use(authenticate);

router.get('/apps', getAppRules);
router.post('/apps/sync', syncAppRules);
router.post('/apps', validate(saveAppRuleSchema), saveAppRule);
router.delete('/apps/:id', deleteAppRule);

router.get('/websites', getWebsiteRules);
router.post('/websites', validate(saveWebsiteRuleSchema), saveWebsiteRule);
router.delete('/websites/:id', deleteWebsiteRule);

router.get('/active-rules', getActiveBlockSession);
router.post('/intervention', validate(recordInterventionSchema), recordIntervention);

export default router;
