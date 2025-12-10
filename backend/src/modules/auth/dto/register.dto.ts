import { IsEmail, IsString, MinLength, Matches, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+33612345678' })
  @IsPhoneNumber('FR')
  phone: string;

  @ApiProperty({ example: 'Password@123', description: 'Must contain uppercase, lowercase and number' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiPropertyOptional({ example: 'driver', enum: ['driver', 'passenger'], default: 'driver' })
  @IsOptional()
  @IsEnum(['driver', 'passenger'])
  userType?: string;
}
