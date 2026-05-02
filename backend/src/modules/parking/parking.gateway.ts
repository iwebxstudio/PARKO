// ============================================
// PARKO — Parking WebSocket Gateway
// Real-time dashboard updates via Socket.IO
// ============================================
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/parking',
})
export class ParkingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ParkingGateway.name);
  private connectedClients = 0;

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} | Total: ${this.connectedClients}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id} | Total: ${this.connectedClients}`);
  }

  /**
   * Broadcast parking update to all connected clients
   */
  broadcastUpdate(data: any) {
    this.server.emit('parking_update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast dashboard stats refresh
   */
  broadcastStatsRefresh(stats: any) {
    this.server.emit('stats_refresh', {
      ...stats,
      timestamp: new Date().toISOString(),
    });
  }
}
