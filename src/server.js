const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// IN-MEMORY DATABASE
// This is where all room data lives. It's wiped on server restart.
const rooms = {};

// Timeout options (milliseconds)
const TIMEOUT_OPTIONS = {
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
};

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    // JOIN ROOM
    socket.on('join_room', ({ roomId, username, timeout }, callback) => {
      // 1. Create room if it doesn't exist
      if (!rooms[roomId]) {
        const duration = TIMEOUT_OPTIONS[timeout] || TIMEOUT_OPTIONS['5min'];

        rooms[roomId] = {
          messages: [],
          createdAt: Date.now(),
          lifetime: duration,
          // 2. Set the self-destruct timer
          timer: setTimeout(() => {
            io.to(roomId).emit('room_expired'); // Tell clients to leave
            io.in(roomId).socketsLeave(roomId); // Kick sockets
            delete rooms[roomId];               // Delete data
          }, duration)
        };
      }

      // 3. Check if room is valid
      const room = rooms[roomId];
      const timeElapsed = Date.now() - room.createdAt;
      const remainingTime = room.lifetime - timeElapsed;

      if (remainingTime <= 0) return callback({ error: 'Room expired' });

      // 4. Join and send current state
      socket.join(roomId);
      callback({
        status: 'ok',
        messages: room.messages,
        remainingTime: remainingTime
      });

      // 5. Notify others
      socket.to(roomId).emit('message', {
        user: 'System',
        text: `${username} has joined.`,
        time: new Date().toLocaleTimeString()
      });
    });

    // SEND MESSAGE
    socket.on('send_message', ({ roomId, username, message }) => {
      if (rooms[roomId]) {
        const msg = {
          user: username,
          text: message,
          time: new Date().toLocaleTimeString()
        };
        rooms[roomId].messages.push(msg); // Save to memory
        io.to(roomId).emit('message', msg); // Send to everyone
      }
    });
  });

  // Next.js Route Handler
  server.use((req, res) => handle(req, res));

  httpServer.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
