import { IsString, IsNumber, IsOptional, IsEnum, IsMongoId, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class UpdateRideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  driverId?: Types.ObjectId;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  actualFare?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  finalPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  acceptedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  startedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  completedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  cancelledAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}
