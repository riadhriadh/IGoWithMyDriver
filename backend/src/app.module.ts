import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import configuration from '@config/configuration';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { DriversModule } from '@modules/drivers/drivers.module';
import { PassengersModule } from '@modules/passengers/passengers.module';
import { RidesModule } from '@modules/rides/rides.module';
import { LocationModule } from '@modules/location/location.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { RatingsModule } from '@modules/ratings/ratings.module';
import { AdminModule } from '@modules/admin/admin.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        retryAttempts: 5,
        retryDelay: 1000,
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        password: configService.get<string>('redis.password'),
        db: configService.get<number>('redis.db'),
        ttl: 600, // 10 minutes
      }),
    }),
    AuthModule,
    UsersModule,
    DriversModule,
    PassengersModule,
    RidesModule,
    LocationModule,
    PaymentsModule,
    RatingsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
