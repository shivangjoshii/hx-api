import { Router } from 'express';
import Joi from 'joi';
import {
  getPublicRooms,
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  endRoom
} from '../controllers/roomController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createRoomSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().allow(''),
  durationMinutes: Joi.number().min(10).max(180),
  isPublic: Joi.boolean(),
  maxParticipants: Joi.number().min(2).max(100),
  leaderboardEnabled: Joi.boolean()
});

router.use(authenticate);

router.get('/public', getPublicRooms);
router.post('/create', validate(createRoomSchema), createRoom);
router.get('/:code', getRoomByCode);
router.post('/:code/join', joinRoom);
router.post('/:code/leave', leaveRoom);
router.post('/:code/end', endRoom);

export default router;
