import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let _io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  _io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  _io.on('connection', (socket) => {
    console.log(`[ws] client connected: ${socket.id}`);

    socket.on('tank_join', (tankId: string) => {
      if (typeof tankId === 'string' && tankId) {
        socket.join(`tank:${tankId}`);
        console.log(`[ws] ${socket.id} joined tank:${tankId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[ws] client disconnected: ${socket.id}`);
    });
  });

  return _io;
}

export function getIO(): Server | null {
  return _io;
}

export function emitSensorUpdate(tankId: string, payload: unknown): void {
  if (!_io) return;
  _io.to(`tank:${tankId}`).emit('sensor_update', payload);
  _io.emit('sensor_update', payload);
}
