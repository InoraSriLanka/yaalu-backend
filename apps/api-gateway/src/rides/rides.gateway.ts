import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * RidesGateway — real-time Socket.io gateway for ride request notifications.
 * Riders connect to this gateway and listen for 'new_hire_request' events.
 * When a customer books a hire, the backend emits to all connected riders.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/rides',
})
export class RidesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RidesGateway');

  afterInit() {
    this.logger.log('✅ Rides Socket.io Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Rider connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Rider disconnected: ${client.id}`);
  }

  /**
   * Broadcast a new hire/ride request to ALL connected rider clients.
   * Call this whenever a customer creates a new ride request.
   */
  broadcastNewHireRequest(rideRequest: {
    id: string;
    pickupAddress: string;
    dropoffAddress: string;
    rideType: string;
    selectedVehicleType?: string;
    finalFare?: number;
    createdAt?: any;
  }) {
    this.logger.log(`📢 Broadcasting new hire request: ${rideRequest.id}`);
    this.server.emit('new_hire_request', {
      type: 'NEW_HIRE_REQUEST',
      title: 'New Hire Request! 🚗',
      body: `${rideRequest.pickupAddress} → ${rideRequest.dropoffAddress}`,
      rideRequest,
      timestamp: new Date().toISOString(),
    });
  }
}
