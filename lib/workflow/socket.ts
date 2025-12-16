import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe', (executionId: string) => {
      socket.join(`execution:${executionId}`);
      console.log(`Client ${socket.id} subscribed to execution:${executionId}`);
    });

    socket.on('unsubscribe', (executionId: string) => {
      socket.leave(`execution:${executionId}`);
      console.log(`Client ${socket.id} unsubscribed from execution:${executionId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function emitExecutionEvent(
  executionId: string,
  event: string,
  data: any
) {
  if (io) {
    io.to(`execution:${executionId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
