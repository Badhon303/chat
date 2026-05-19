// Socket.IO standalone server (Pure JavaScript)
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  console.log(`User connected: ${userId} (socket: ${socket.id})`);

  if (userId) {
    connectedUsers.set(userId, { socketId: socket.id, userId });

    // Broadcast online status
    socket.broadcast.emit('user:online', {
      userId,
      isOnline: true,
      lastSeen: new Date().toISOString(),
    });

    // Join a private room for the user
    socket.join(`user:${userId}`);
  }

  // Handle new message
  socket.on('message:send', (data) => {
    const { message } = data;
    // Send to receiver
    const receiver = connectedUsers.get(message.receiverId);
    if (receiver) {
      io.to(`user:${message.receiverId}`).emit('message:receive', { message });
      // Auto mark as delivered
      io.to(`user:${message.senderId}`).emit('message:delivered', {
        messageId: message.id,
      });
    }
  });

  // Handle typing
  socket.on('typing:start', (data) => {
    const { receiverId } = data;
    if (userId) {
      io.to(`user:${receiverId}`).emit('typing:update', {
        userId,
        isTyping: true,
      });
    }
  });

  socket.on('typing:stop', (data) => {
    const { receiverId } = data;
    if (userId) {
      io.to(`user:${receiverId}`).emit('typing:update', {
        userId,
        isTyping: false,
      });
    }
  });

  // Handle read receipts
  socket.on('message:read', (data) => {
    const { messageIds, senderId } = data;
    if (userId) {
      io.to(`user:${senderId}`).emit('message:seen', {
        messageIds,
        readBy: userId,
      });
    }
  });

  // Handle reactions
  socket.on('message:reaction', (data) => {
    const { reaction, messageId, action, receiverId } = data;
    io.to(`user:${receiverId}`).emit('message:reaction:update', {
      reaction,
      messageId,
      action,
    });
  });

  // Handle message delete
  socket.on('message:delete', (data) => {
    const { messageId, receiverId } = data;
    if (userId) {
      io.to(`user:${receiverId}`).emit('message:deleted', {
        messageId,
        deletedBy: userId,
      });
    }
  });

  // Handle message edit
  socket.on('message:edit', (data) => {
    const { messageId, content, receiverId } = data;
    if (userId) {
      io.to(`user:${receiverId}`).emit('message:edited', {
        messageId,
        content,
        editedBy: userId,
      });
    }
  });

  // Handle message pin
  socket.on('message:pin', (data) => {
    const { messageId, isPinned, receiverId } = data;
    io.to(`user:${receiverId}`).emit('message:pinned', {
      messageId,
      isPinned,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    if (userId) {
      connectedUsers.delete(userId);

      socket.broadcast.emit('user:online', {
        userId,
        isOnline: false,
        lastSeen: new Date().toISOString(),
      });
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
