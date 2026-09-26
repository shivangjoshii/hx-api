import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { ENV } from '../config/env.js';

export const setupRoomSockets = (io) => {
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        if (typeof token === 'string' && token.startsWith('Bearer ')) {
          token = token.slice(7).trim();
        }
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('name avatar level');
        if (user) {
          socket.user = user;
        }
      }

      if (!socket.user) {
        socket.user = {
          _id: `guest_${socket.id.slice(0, 8)}`,
          name: `Focus Explorer ${socket.id.slice(0, 4)}`,
          avatar: '',
          level: 1
        };
      }
      next();
    } catch {
      socket.user = {
        _id: `guest_${socket.id.slice(0, 8)}`,
        name: `Focus Explorer ${socket.id.slice(0, 4)}`,
        avatar: '',
        level: 1
      };
      next();
    }
  });

  io.on('connection', (socket) => {
    socket.emit('connection_established', {
      socketId: socket.id,
      user: socket.user
    });

    socket.on('join_room', async ({ roomCode }) => {
      try {
        const cleanCode = (roomCode || 'LOBBY').toUpperCase().trim();
        socket.join(cleanCode);

        let room = await Room.findOne({ roomCode: cleanCode, status: 'active' });
        if (!room) {
          room = await Room.create({
            roomCode: cleanCode,
            name: `${cleanCode} Focus Room`,
            category: 'Study',
            hostUserId: socket.user._id,
            durationMinutes: 45,
            isPublic: true,
            maxParticipants: 50,
            activeParticipants: []
          });
        }

        const exists = room.activeParticipants.find(
          (p) => p.userId.toString() === socket.user._id.toString() || p.socketId === socket.id
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
          exists.name = socket.user.name;
          await room.save();
        }

        io.to(cleanCode).emit('room_updated', {
          roomCode: cleanCode,
          roomName: room.name,
          activeParticipants: room.activeParticipants,
          totalParticipants: room.activeParticipants.length
        });

        socket.emit('joined_success', {
          roomCode: cleanCode,
          roomName: room.name,
          participants: room.activeParticipants
        });
      } catch (err) {
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('update_focus_progress', async ({ roomCode, focusedMinutes, status }) => {
      try {
        const cleanCode = (roomCode || 'LOBBY').toUpperCase().trim();
        const room = await Room.findOne({ roomCode: cleanCode, status: 'active' });

        if (room && socket.user) {
          const participant = room.activeParticipants.find(
            (p) => p.userId.toString() === socket.user._id.toString() || p.socketId === socket.id
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
      const cleanCode = (roomCode || 'LOBBY').toUpperCase().trim();

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
        const cleanCode = (roomCode || 'LOBBY').toUpperCase().trim();
        socket.leave(cleanCode);

        if (socket.user) {
          const room = await Room.findOne({ roomCode: cleanCode, status: 'active' });
          if (room) {
            room.activeParticipants = room.activeParticipants.filter(
              (p) => p.userId.toString() !== socket.user._id.toString() && p.socketId !== socket.id
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
      } catch {}
    });
  });
};
