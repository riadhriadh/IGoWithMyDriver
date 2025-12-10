import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RidesService } from './rides.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/rides',
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('RidesGateway');

  constructor(private ridesService: RidesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-ride')
  handleJoinRide(client: Socket, data: { rideId: string; userId: string }) {
    const room = `ride:${data.rideId}`;
    client.join(room);
    this.logger.log(`User ${data.userId} joined ride ${data.rideId}`);
  }

  @SubscribeMessage('leave-ride')
  handleLeaveRide(client: Socket, data: { rideId: string }) {
    const room = `ride:${data.rideId}`;
    client.leave(room);
  }

  @SubscribeMessage('ride-update')
  handleRideUpdate(client: Socket, data: any) {
    const room = `ride:${data.rideId}`;
    this.server.to(room).emit('ride-updated', data);
  }

  @SubscribeMessage('driver-location')
  handleDriverLocation(client: Socket, data: { rideId: string; latitude: number; longitude: number }) {
    const room = `ride:${data.rideId}`;
    this.server.to(room).emit('driver-location-updated', {
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date(),
    });
  }

  sendRideUpdate(rideId: string, data: any) {
    this.server.to(`ride:${rideId}`).emit('ride-updated', data);
  }
}
