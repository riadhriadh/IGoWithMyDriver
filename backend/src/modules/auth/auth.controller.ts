import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './dto/auth-response.dto';
import { PassportAuthGuard } from '@common/guards/passport-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (driver or passenger)' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponse,
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponse,
  })
  async login(@Body() loginDto: LoginDto) {
    console.log('loginDto', loginDto);
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    // Note: In a real implementation, you'd decode the token to get userId
    return this.authService.refreshToken(refreshTokenDto.userId, refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@GetUser() user: any) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
  })
  async getCurrentUser(@GetUser() user: any) {
    return user;
  }

  @Get('profile')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (alias for /me)' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
  })
  async getProfile(@GetUser() user: any) {
    // Return user data with driver/passenger info if exists
    return { 
      user: {
        ...user,
        driver: user.userType === 'driver' ? {
          id: user._id,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          status: user.isActive ? 'available' : 'offline',
          rating: 0,
          totalRides: 0,
        } : undefined,
      }
    };
  }
}
