# Implémentation du Module Rides

## Schéma Ride

`src/rides/schemas/ride.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RideDocument = Ride & Document;

export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  EN_ROUTE_TO_PICKUP = 'en_route_to_pickup',
  ARRIVED_AT_PICKUP = 'arrived_at_pickup',
  PASSENGER_ONBOARD = 'passenger_onboard',
  ARRIVED_AT_DESTINATION = 'arrived_at_destination',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  SCHEDULED = 'scheduled',
}

@Schema({ timestamps: true })
export class Ride {
  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;

  @Prop({ required: true })
  passengerName: string;

  @Prop({ required: true })
  passengerPhone: string;

  @Prop({ required: true })
  pickupAddress: string;

  @Prop({ required: true, type: Number })
  pickupLatitude: number;

  @Prop({ required: true, type: Number })
  pickupLongitude: number;

  @Prop({ required: true })
  destinationAddress: string;

  @Prop({ required: true, type: Number })
  destinationLatitude: number;

  @Prop({ required: true, type: Number })
  destinationLongitude: number;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, default: 'immediate' })
  type: string; // 'immediate' | 'scheduled'

  @Prop({ required: true, enum: RideStatus, default: RideStatus.REQUESTED })
  status: RideStatus;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  specialInstructions?: string;

  @Prop({ required: true })
  vehicleType: string;

  // Timestamps de transition
  @Prop()
  acceptedAt?: Date;

  @Prop()
  pickupStartedAt?: Date;

  @Prop()
  arrivedAtPickupAt?: Date;

  @Prop()
  tripStartedAt?: Date;

  @Prop()
  arrivedAtDestinationAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelledReason?: string;

  // Évaluation
  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop()
  passengerComment?: string;
}

export const RideSchema = SchemaFactory.createForClass(Ride);

// Index pour les recherches
RideSchema.index({ driverId: 1, status: 1 });
RideSchema.index({ status: 1, createdAt: -1 });
RideSchema.index({ pickupLatitude: 1, pickupLongitude: 1 });
```

## DTOs

### Create Ride DTO

`src/rides/dto/create-ride.dto.ts`:

```typescript
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRideDto {
  @ApiProperty()
  @IsString()
  passengerName: string;

  @ApiProperty()
  @IsString()
  passengerPhone: string;

  @ApiProperty()
  @IsString()
  pickupAddress: string;

  @ApiProperty()
  @IsNumber()
  pickupLatitude: number;

  @ApiProperty()
  @IsNumber()
  pickupLongitude: number;

  @ApiProperty()
  @IsString()
  destinationAddress: string;

  @ApiProperty()
  @IsNumber()
  destinationLatitude: number;

  @ApiProperty()
  @IsNumber()
  destinationLongitude: number;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ enum: ['immediate', 'scheduled'] })
  @IsEnum(['immediate', 'scheduled'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty()
  @IsString()
  vehicleType: string;
}
```

### Update Ride Status DTO

`src/rides/dto/update-ride-status.dto.ts`:

```typescript
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RideStatus } from '../schemas/ride.schema';

export class UpdateRideStatusDto {
  @ApiProperty({ enum: RideStatus })
  @IsEnum(RideStatus)
  status: RideStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}
```

## Service

`src/rides/rides.service.ts`:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ride, RideDocument, RideStatus } from './schemas/ride.schema';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideStatusDto } from './dto/update-ride-status.dto';
import { RidesGateway } from './rides.gateway';

@Injectable()
export class RidesService {
  constructor(
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    private ridesGateway: RidesGateway,
  ) {}

  async create(createRideDto: CreateRideDto, driverId?: string): Promise<Ride> {
    const ride = new this.rideModel({
      ...createRideDto,
      driverId: driverId ? new Types.ObjectId(driverId) : undefined,
      status: createRideDto.type === 'scheduled' ? RideStatus.SCHEDULED : RideStatus.REQUESTED,
    });

    const savedRide = await ride.save();

    // Notifier tous les chauffeurs disponibles
    this.ridesGateway.notifyNewRide(savedRide);

    return savedRide;
  }

  async findAll(filters?: {
    driverId?: string;
    status?: RideStatus;
    limit?: number;
  }): Promise<Ride[]> {
    const query: any = {};

    if (filters?.driverId) {
      query.driverId = new Types.ObjectId(filters.driverId);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    return this.rideModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .exec();
  }

  async findAvailableRides(): Promise<Ride[]> {
    return this.rideModel
      .find({
        status: RideStatus.REQUESTED,
        driverId: null,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Ride> {
    const ride = await this.rideModel.findById(id).exec();

    if (!ride) {
      throw new NotFoundException('Course introuvable');
    }

    return ride;
  }

  async acceptRide(rideId: string, driverId: string): Promise<Ride> {
    const ride = await this.findOne(rideId);

    if (ride.status !== RideStatus.REQUESTED) {
      throw new BadRequestException('Cette course ne peut plus être acceptée');
    }

    if (ride.driverId) {
      throw new BadRequestException('Cette course a déjà été acceptée');
    }

    ride.driverId = new Types.ObjectId(driverId);
    ride.status = RideStatus.ACCEPTED;
    ride.acceptedAt = new Date();

    const updatedRide = await ride.save();

    // Notifier le changement de statut
    this.ridesGateway.notifyRideUpdate(updatedRide);

    return updatedRide;
  }

  async updateStatus(
    rideId: string,
    updateDto: UpdateRideStatusDto,
    driverId: string,
  ): Promise<Ride> {
    const ride = await this.findOne(rideId);

    // Vérifier que c'est le bon chauffeur
    if (ride.driverId?.toString() !== driverId) {
      throw new BadRequestException('Vous ne pouvez pas modifier cette course');
    }

    // Valider la transition de statut
    this.validateStatusTransition(ride.status, updateDto.status);

    // Mettre à jour le statut et les timestamps
    ride.status = updateDto.status;

    switch (updateDto.status) {
      case RideStatus.EN_ROUTE_TO_PICKUP:
        ride.pickupStartedAt = new Date();
        break;
      case RideStatus.ARRIVED_AT_PICKUP:
        ride.arrivedAtPickupAt = new Date();
        break;
      case RideStatus.PASSENGER_ONBOARD:
        ride.tripStartedAt = new Date();
        break;
      case RideStatus.ARRIVED_AT_DESTINATION:
        ride.arrivedAtDestinationAt = new Date();
        break;
      case RideStatus.COMPLETED:
        ride.completedAt = new Date();
        break;
      case RideStatus.CANCELLED:
        ride.cancelledAt = new Date();
        ride.cancelledBy = new Types.ObjectId(driverId);
        ride.cancelledReason = updateDto.cancelledReason;
        break;
      case RideStatus.NO_SHOW:
        ride.cancelledAt = new Date();
        ride.cancelledBy = new Types.ObjectId(driverId);
        ride.cancelledReason = 'Client absent au point de rendez-vous';
        break;
    }

    const updatedRide = await ride.save();

    // Notifier le changement de statut
    this.ridesGateway.notifyRideUpdate(updatedRide);

    return updatedRide;
  }

  private validateStatusTransition(currentStatus: RideStatus, newStatus: RideStatus): void {
    const validTransitions: Record<RideStatus, RideStatus[]> = {
      [RideStatus.REQUESTED]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
      [RideStatus.ACCEPTED]: [
        RideStatus.EN_ROUTE_TO_PICKUP,
        RideStatus.CANCELLED,
      ],
      [RideStatus.EN_ROUTE_TO_PICKUP]: [
        RideStatus.ARRIVED_AT_PICKUP,
        RideStatus.CANCELLED,
      ],
      [RideStatus.ARRIVED_AT_PICKUP]: [
        RideStatus.PASSENGER_ONBOARD,
        RideStatus.NO_SHOW,
        RideStatus.CANCELLED,
      ],
      [RideStatus.PASSENGER_ONBOARD]: [
        RideStatus.ARRIVED_AT_DESTINATION,
        RideStatus.CANCELLED,
      ],
      [RideStatus.ARRIVED_AT_DESTINATION]: [RideStatus.COMPLETED],
      [RideStatus.COMPLETED]: [],
      [RideStatus.CANCELLED]: [],
      [RideStatus.NO_SHOW]: [],
      [RideStatus.SCHEDULED]: [RideStatus.REQUESTED, RideStatus.CANCELLED],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Transition invalide de ${currentStatus} vers ${newStatus}`,
      );
    }
  }

  async getDriverStats(driverId: string) {
    const stats = await this.rideModel.aggregate([
      {
        $match: {
          driverId: new Types.ObjectId(driverId),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$price' },
        },
      },
    ]);

    return stats;
  }
}
```

## Gateway (WebSocket)

`src/rides/rides.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private driverSockets = new Map<string, string>(); // driverId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Retirer le socket du map
    for (const [driverId, socketId] of this.driverSockets.entries()) {
      if (socketId === client.id) {
        this.driverSockets.delete(driverId);
        break;
      }
    }
  }

  @SubscribeMessage('driver:register')
  handleDriverRegister(client: Socket, driverId: string) {
    this.driverSockets.set(driverId, client.id);
    client.join(`driver:${driverId}`);
    console.log(`Driver ${driverId} registered with socket ${client.id}`);
  }

  notifyNewRide(ride: any) {
    // Notifier tous les chauffeurs disponibles
    this.server.emit('ride:new', ride);
  }

  notifyRideUpdate(ride: any) {
    // Notifier le chauffeur spécifique
    if (ride.driverId) {
      this.server.to(`driver:${ride.driverId}`).emit('ride:updated', ride);
    }

    // Notifier aussi tous les clients (pour mise à jour de la liste)
    this.server.emit('ride:status-changed', {
      rideId: ride._id,
      status: ride.status,
    });
  }

  notifyDriverLocation(driverId: string, location: { latitude: number; longitude: number }) {
    this.server.emit('driver:location', {
      driverId,
      location,
    });
  }
}
```

## Controller

`src/rides/rides.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideStatusDto } from './dto/update-ride-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RideStatus } from './schemas/ride.schema';

@ApiTags('Rides')
@Controller('rides')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ride' })
  create(@Body() createRideDto: CreateRideDto, @Request() req) {
    return this.ridesService.create(createRideDto, req.user._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rides' })
  findAll(
    @Query('status') status?: RideStatus,
    @Query('limit') limit?: number,
    @Request() req?,
  ) {
    return this.ridesService.findAll({
      driverId: req.user._id,
      status,
      limit,
    });
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available rides' })
  findAvailable() {
    return this.ridesService.findAvailableRides();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get driver stats' })
  getStats(@Request() req) {
    return this.ridesService.getDriverStats(req.user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride by ID' })
  findOne(@Param('id') id: string) {
    return this.ridesService.findOne(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a ride' })
  acceptRide(@Param('id') id: string, @Request() req) {
    return this.ridesService.acceptRide(id, req.user._id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update ride status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateRideStatusDto,
    @Request() req,
  ) {
    return this.ridesService.updateStatus(id, updateDto, req.user._id);
  }
}
```

## Module

`src/rides/rides.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { RidesGateway } from './rides.gateway';
import { Ride, RideSchema } from './schemas/ride.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ride.name, schema: RideSchema }]),
  ],
  controllers: [RidesController],
  providers: [RidesService, RidesGateway],
  exports: [RidesService],
})
export class RidesModule {}
```

## Utilisation côté Client (React Native)

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: accessToken,
  },
});

// S'enregistrer comme chauffeur
socket.emit('driver:register', driverId);

// Écouter les nouvelles courses
socket.on('ride:new', (ride) => {
  console.log('Nouvelle course disponible:', ride);
  // Afficher notification
});

// Écouter les mises à jour de courses
socket.on('ride:updated', (ride) => {
  console.log('Course mise à jour:', ride);
  // Rafraîchir l'interface
});
```
