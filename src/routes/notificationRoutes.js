import { Router } from 'express';
import Joi from 'joi';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  triggerSmartNudge
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const nudgeSchema = Joi.object({
  title: Joi.string().allow(''),
  body: Joi.string().allow(''),
  type: Joi.string().allow(''),
  metadata: Joi.object().allow(null)
});

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.post('/read-all', markAllNotificationsRead);
router.post('/smart-nudge', validate(nudgeSchema), triggerSmartNudge);

export default router;
