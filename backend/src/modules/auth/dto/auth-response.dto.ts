import { ApiProperty } from '@nestjs/swagger';

export class AuthResponse {
  @ApiProperty({
    example: {
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678',
      userType: 'driver',
    },
  })
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    userType: string;
  };

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;
}
