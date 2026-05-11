const socketIo = require('socket.io');

class WebSocketService {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.activeCleanups = new Map(); // serverName -> cleanup session
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join cleanup room for specific server
      socket.on('join-cleanup-room', (serverName) => {
        socket.join(`cleanup-${serverName}`);
        console.log(`Client ${socket.id} joined cleanup room for ${serverName}`);
      });

      // Leave cleanup room
      socket.on('leave-cleanup-room', (serverName) => {
        socket.leave(`cleanup-${serverName}`);
        console.log(`Client ${socket.id} left cleanup room for ${serverName}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Start cleanup session for a server
  startCleanupSession(serverName, sessionId) {
    const session = {
      id: sessionId,
      serverName,
      startTime: new Date(),
      logs: [],
      status: 'running'
    };

    this.activeCleanups.set(serverName, session);

    // Emit to all clients in the cleanup room
    this.io.to(`cleanup-${serverName}`).emit('cleanup-started', {
      sessionId,
      serverName,
      startTime: session.startTime
    });

    return session;
  }

  // Add log entry to cleanup session
  addCleanupLog(serverName, logEntry) {
    const session = this.activeCleanups.get(serverName);
    if (!session) return;

    const logWithTimestamp = {
      ...logEntry,
      timestamp: new Date()
    };

    session.logs.push(logWithTimestamp);

    // Emit log to all clients in the cleanup room
    this.io.to(`cleanup-${serverName}`).emit('cleanup-log', logWithTimestamp);
  }

  // Update cleanup progress
  updateCleanupProgress(serverName, progress) {
    this.io.to(`cleanup-${serverName}`).emit('cleanup-progress', {
      ...progress,
      timestamp: new Date()
    });
  }

  // Complete cleanup session
  completeCleanupSession(serverName, results) {
    const session = this.activeCleanups.get(serverName);
    if (!session) return;

    session.status = 'completed';
    session.endTime = new Date();
    session.results = results;

    // Emit completion to all clients
    this.io.to(`cleanup-${serverName}`).emit('cleanup-completed', {
      sessionId: session.id,
      serverName,
      results,
      endTime: session.endTime,
      duration: session.endTime - session.startTime
    });

    // Clean up after a delay
    setTimeout(() => {
      this.activeCleanups.delete(serverName);
    }, 300000); // Keep for 5 minutes
  }

  // Fail cleanup session
  failCleanupSession(serverName, error) {
    const session = this.activeCleanups.get(serverName);
    if (!session) return;

    session.status = 'failed';
    session.endTime = new Date();
    session.error = error;

    // Emit failure to all clients
    this.io.to(`cleanup-${serverName}`).emit('cleanup-failed', {
      sessionId: session.id,
      serverName,
      error,
      endTime: session.endTime,
      duration: session.endTime - session.startTime
    });

    // Clean up after a delay
    setTimeout(() => {
      this.activeCleanups.delete(serverName);
    }, 300000); // Keep for 5 minutes
  }

  // Get active cleanup sessions
  getActiveCleanups() {
    return Array.from(this.activeCleanups.values());
  }

  // Get cleanup session for server
  getCleanupSession(serverName) {
    return this.activeCleanups.get(serverName);
  }
}

module.exports = WebSocketService;