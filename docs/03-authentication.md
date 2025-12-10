# Implémentation de l'Authentification

## Architecture d'Authentification

L'authentification utilise:
- **JWT** pour les tokens d'accès (courte durée)
- **Refresh tokens** pour renouveler les tokens d'accès
- **Bcrypt** pour le hachage des mots de passe
- **Passport** pour les stratégies d'authentification

## Schéma Driver (Utilisateur)

`src/drivers/schemas/driver.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DriverDocument = Driver & Document;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: Object })
  location?: {
    latitude: number;
    longitude: number;
    updatedAt: Date;
  };

  @Prop({ default: 'offline' })
  status: 'available' | 'busy' | 'offline';

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: false })
  isAvailable: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  refreshToken?: string;

  @Prop({ default: Date.now })
  lastLoginAt: Date;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

// Index pour les recherches géospatiales
DriverSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
```

## DTOs de Validation

### Register DTO

`src/auth/dto/register.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength, Matches, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Le mot de passe doit contenir majuscules, minuscules et chiffres',
  })
  password: string;

  @ApiProperty({ example: '+33612345678' })
  @IsPhoneNumber('FR')
  phone: string;
}
```

### Login DTO

`src/auth/dto/login.dto.ts`:

```typescript
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}
```

## Service d'Authentification

`src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Driver, DriverDocument } from '../drivers/schemas/driver.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Vérifier si l'utilisateur existe
    const existingDriver = await this.driverModel.findOne({
      $or: [{ email: registerDto.email }, { phone: registerDto.phone }],
    });

    if (existingDriver) {
      throw new UnauthorizedException('Email ou téléphone déjà utilisé');
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Créer le chauffeur
    const driver = new this.driverModel({
      ...registerDto,
      password: hashedPassword,
    });

    await driver.save();

    // Générer les tokens
    const tokens = await this.generateTokens(driver._id.toString());

    // Sauvegarder le refresh token
    await this.updateRefreshToken(driver._id.toString(), tokens.refreshToken);

    return {
      driver: this.sanitizeDriver(driver),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Trouver le chauffeur
    const driver = await this.driverModel.findOne({ email: loginDto.email });

    if (!driver) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(loginDto.password, driver.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Mettre à jour lastLoginAt
    driver.lastLoginAt = new Date();
    await driver.save();

    // Générer les tokens
    const tokens = await this.generateTokens(driver._id.toString());

    // Sauvegarder le refresh token
    await this.updateRefreshToken(driver._id.toString(), tokens.refreshToken);

    return {
      driver: this.sanitizeDriver(driver),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const driver = await this.driverModel.findById(userId);

    if (!driver || !driver.refreshToken) {
      throw new UnauthorizedException('Accès refusé');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, driver.refreshToken);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Accès refusé');
    }

    const tokens = await this.generateTokens(driver._id.toString());
    await this.updateRefreshToken(driver._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.driverModel.findByIdAndUpdate(userId, { refreshToken: null });
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.configService.get('jwt.secret'),
          expiresIn: this.configService.get('jwt.expiresIn'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.configService.get('jwt.refreshSecret'),
          expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.driverModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  private sanitizeDriver(driver: DriverDocument) {
    const { password, refreshToken, ...sanitized } = driver.toObject();
    return sanitized;
  }
}
```

## Stratégies Passport

### JWT Strategy

`src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from '../../drivers/schemas/driver.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: { sub: string }) {
    const driver = await this.driverModel.findById(payload.sub);

    if (!driver) {
      throw new UnauthorizedException();
    }

    return driver;
  }
}
```

### Refresh JWT Strategy

`src/auth/strategies/jwt-refresh.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string }) {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      refreshToken,
    };
  }
}
```

## Guards

`src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

`src/auth/guards/jwt-refresh-auth.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
```

## Controller

`src/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new driver' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Request() req) {
    return this.authService.refreshTokens(req.user.userId, req.user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout' })
  logout(@Request() req) {
    return this.authService.logout(req.user._id);
  }
}
```

## Module d'Authentification

`src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Driver, DriverSchema } from '../drivers/schemas/driver.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

## Utilisation dans les Routes Protégées

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('drivers')
export class DriversController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
```

## Test avec cURL

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "phone": "+33612345678"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'

# Utiliser le token
curl -X GET http://localhost:3000/api/v1/drivers/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
