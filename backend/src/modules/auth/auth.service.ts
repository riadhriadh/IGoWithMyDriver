import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmailOrPhone(registerDto.email, registerDto.phone);

    if (existingUser) {
      throw new BadRequestException('Email or phone already registered');
    }

    const hashedPassword = await bcryptjs.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      userType: registerDto.userType || 'driver',
    });

    const tokens = this.generateTokens(user._id.toString(), user.email, user.userType);

    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    const sanitizedUser = this.sanitizeUser(user);
    
    // Add driver info if user is a driver
    const responseUser = {
      ...sanitizedUser,
      role: user.userType,
    };

    if (user.userType === 'driver') {
      responseUser.driver = {
        id: user._id.toString(),
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.isActive ? 'available' : 'offline',
        rating: 0,
        totalRides: 0,
      };
    }

    return {
      user: responseUser,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcryptjs.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.userType);

    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    const sanitizedUser = this.sanitizeUser(user);
    
    // Add driver info if user is a driver
    const responseUser = {
      ...sanitizedUser,
      role: user.userType,
    };

    if (user.userType === 'driver') {
      responseUser.driver = {
        id: user._id.toString(),
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.isActive ? 'available' : 'offline',
        rating: 0,
        totalRides: 0,
      };
    }

    return {
      user: responseUser,
      ...tokens,
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.userType);

    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  private generateTokens(userId: string, email: string, userType: string) {
    const payload = { sub: userId, email, userType };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, ...sanitized } = user.toObject ? user.toObject() : user;
    return sanitized;
  }
}
