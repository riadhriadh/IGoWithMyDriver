import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/location',
})
export class LocationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('LocationGateway');
  private driverConnections: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Location client connected: ${client.id}`);
  }

  @SubscribeMessage('register-driver')
  handleRegisterDriver(client: Socket, data: { driverId: string }) {
    this.driverConnections.set(data.driverId, client.id);
    client.join(`driver:${data.driverId}`);
    this.logger.log(`Driver ${data.driverId} registered for location tracking`);
  }

  @SubscribeMessage('location-update')
  handleLocationUpdate(client: Socket, data: { driverId: string; latitude: number; longitude: number; accuracy: number }) {
    const room = `driver:${data.driverId}`;
    this.server.to(room).emit('location-updated', data);
  }

  broadcastDriverLocation(driverId: string, locationData: any) {
    this.server.to(`driver:${driverId}`).emit('location-updated', locationData);
  }
}
