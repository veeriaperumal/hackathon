import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let ioServer: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  ioServer = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  ioServer.on('connection', (socket: Socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    socket.on('subscribe.dashboard', () => {
      socket.join('dashboard');
      console.log(`Socket ${socket.id} subscribed to dashboard stream.`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return ioServer;
}

export function broadcastSocketEvent(event: string, payload: any) {
  if (ioServer) {
    ioServer.emit(event, payload);
  }
}
