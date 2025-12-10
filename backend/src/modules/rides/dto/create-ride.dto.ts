import { IsNumber, IsString, IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateRideDto {
  @ApiProperty()
  @IsMongoId()
  passengerId: Types.ObjectId;

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
  estimatedFare: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rideType?: string;
}
