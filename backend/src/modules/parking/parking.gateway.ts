// ==============================================================================
// PARKO — ເກດເວການສື່ສານແບບສົດໆ (Parking WebSocket Gateway)
// ສົ່ງຕໍ່ຂໍ້ມູນການອັບເດດລານຈອດລົດ ແລະ ສະຖິຕິ Dashboard ໄປຍັງທຸກໜ້າຈໍແບບ Real-time ຜ່ານ Socket.IO
// ==============================================================================
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
    this.logger.log(
      `Client connected: ${client.id} | Total: ${this.connectedClients}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `Client disconnected: ${client.id} | Total: ${this.connectedClients}`,
    );
  }

  /**
   * ກະຈາຍຂໍ້ມູນການອັບເດດປີ້ຈອດລົດ (Check-in / Check-out) ໄປຍັງ Client ທຸກຄົນທີ່ເຊື່ອມຕໍ່ຢູ່
   */
  broadcastUpdate(data: any) {
    this.server.emit('parking_update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * ກະຈາຍສັນຍານໃຫ້ທຸກໜ້າຈໍຣີເຟຣຊຂໍ້ມູນສະຖິຕິ Dashboard ໃໝ່
   */
  broadcastStatsRefresh(stats: any) {
    this.server.emit('stats_refresh', {
      ...stats,
      timestamp: new Date().toISOString(),
    });
  }
}
