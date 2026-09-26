import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { ENV } from '../config/env.js';

export const setupRoomSockets = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('name avatar level');
        if (user) {
          socket.user = user;
        }
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_room', async ({ roomCode }) => {
      try {
        const cleanCode = (roomCode || '').toUpperCase().trim();
        socket.join(cleanCode);

        const room = await Room.findOne({ roomCode: cleanCode, status: 'active' });
        if (room && socket.user) {
          const exists = room.activeParticipants.find(
            (p) => p.userId.toString() === socket.user._id.toString()
          );

          if (!exists) {
            room.activeParticipants.push({
              userId: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar || '',
              joinedAt: new Date(),
              focusedMinutes: 0,
              status: 'focusing',
              socketId: socket.id
            });
            await room.save();
          } else {
            exists.socketId = socket.id;
            await room.save();
          }

          io.to(cleanCode).emit('room_updated', {
            roomCode: cleanCode,
            activeParticipants: room.activeParticipants,
            totalParticipants: room.activeParticipants.length
          });
        }
      } catch (err) {
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('update_focus_progress', async ({ roomCode, focusedMinutes, status }) => {
      try {
        const cleanCode = (roomCode || '').toUpperCase().trim();
        const room = await Room.findOne({ roomCode: cleanCode, status: 'active' });

        if (room && socket.user) {
          const participant = room.activeParticipants.find(
            (p) => p.userId.toString() === socket.user._id.toString()
          );

          if (participant) {
            if (focusedMinutes !== undefined) participant.focusedMinutes = focusedMinutes;
            if (status) participant.status = status;
            await room.save();

            io.to(cleanCode).emit('participant_progress_updated', {
              userId: socket.user._id,
              name: socket.user.name,
              focusedMinutes: participant.focusedMinutes,
              status: participant.status
            });
          }
        }
      } catch (err) {
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('send_reaction', ({ roomCode, reaction }) => {
      const allowedReactions = ['🔥', '👏', '❤️', '💯', '⚡', '🎯'];
      const cleanCode = (roomCode || '').toUpperCase().trim();

      if (allowedReactions.includes(reaction) && socket.user) {
        io.to(cleanCode).emit('reaction_received', {
          userId: socket.user._id,
          userName: socket.user.name,
          reaction,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('leave_room', async ({ roomCode }) => {
      try {
        const cleanCode = (roomCode || '').toUpperCase().trim();
        socket.leave(cleanCode);

        if (socket.user) {
          const room = await Room.findOne({ roomCode: cleanCode, status: 'active' });
          if (room) {
            room.activeParticipants = room.activeParticipants.filter(
              (p) => p.userId.toString() !== socket.user._id.toString()
            );

            if (room.activeParticipants.length === 0) {
              room.status = 'ended';
            }
            await room.save();

            io.to(cleanCode).emit('room_updated', {
              roomCode: cleanCode,
              activeParticipants: room.activeParticipants,
              totalParticipants: room.activeParticipants.length
            });
          }
        }
      } catch (err) {
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('disconnect', async () => {
      try {
        if (socket.user) {
          const rooms = await Room.find({
            status: 'active',
            'activeParticipants.socketId': socket.id
          });

          for (const room of rooms) {
            room.activeParticipants = room.activeParticipants.filter(
              (p) => p.socketId !== socket.id
            );
            if (room.activeParticipants.length === 0) {
              room.status = 'ended';
            }
            await room.save();

            io.to(room.roomCode).emit('room_updated', {
              roomCode: room.roomCode,
              activeParticipants: room.activeParticipants,
              totalParticipants: room.activeParticipants.length
            });
          }
        }
      } catch {}
    });
  });
};
