import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { User, UserProfile } from '../database/entities';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { GoogleAuthDto, AppleAuthDto } from './dto/social-auth.dto';
import { AuthResponse, JwtPayload } from './interfaces/auth.interface';
import { GoogleAuthService } from './services/google-auth.service';
import { AppleAuthService } from './services/apple-auth.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    private googleAuthService: GoogleAuthService,
    private appleAuthService: AppleAuthService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password } = registerDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      emailVerificationToken: randomBytes(32).toString('hex'),
    });

    const savedUser = await this.userRepository.save(user);

    // Create default profile
    const profile = this.profileRepository.create({
      userId: savedUser.id,
      units: 'metric',
    });

    await this.profileRepository.save(profile);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || user.provider !== 'local') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token exists in Redis
      const storedToken = await this.redis.get(`refresh_token:${payload.sub}`);

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`refresh_token:${userId}`);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.save(user);

    // TODO: Send email with resetToken
    // For now, log it (remove in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, password } = resetPasswordDto;

    // Find user with valid reset token
    const users = await this.userRepository.find({
      where: {
        passwordResetExpires: new Date(),
      },
    });

    let user: User | null = null;
    
    for (const u of users) {
      if (u.passwordResetToken && u.passwordResetExpires) {
        const isValid = await bcrypt.compare(token, u.passwordResetToken);
        if (isValid && u.passwordResetExpires > new Date()) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await this.userRepository.save(user);
  }

  async googleLogin(googleAuthDto: GoogleAuthDto): Promise<AuthResponse> {
    const { idToken } = googleAuthDto;

    // Verify Google ID token
    const googleUser = await this.googleAuthService.verifyIdToken(idToken);

    // Find or create user
    let user = await this.userRepository.findOne({
      where: [
        { email: googleUser.email, provider: 'google' },
        { providerId: googleUser.sub, provider: 'google' },
      ],
    });

    const isNewUser = !user;

    if (!user) {
      // Check if email exists with different provider
      const existingEmailUser = await this.userRepository.findOne({
        where: { email: googleUser.email },
      });

      if (existingEmailUser && existingEmailUser.provider !== 'google') {
        throw new ConflictException(
          `An account with this email already exists using ${existingEmailUser.provider} login`,
        );
      }

      // Create new user
      user = this.userRepository.create({
        email: googleUser.email,
        provider: 'google',
        providerId: googleUser.sub,
        displayName: googleUser.name,
        photoUrl: googleUser.picture,
        isEmailVerified: googleUser.email_verified,
      });

      const savedUser = await this.userRepository.save(user);

      // Create default profile
      const profile = this.profileRepository.create({
        userId: savedUser.id,
        units: 'metric',
      });

      await this.profileRepository.save(profile);

      user = savedUser;
    } else {
      // Update user info if changed
      let updated = false;

      if (user.displayName !== googleUser.name) {
        user.displayName = googleUser.name;
        updated = true;
      }

      if (user.photoUrl !== googleUser.picture) {
        user.photoUrl = googleUser.picture;
        updated = true;
      }

      if (!user.isEmailVerified && googleUser.email_verified) {
        user.isEmailVerified = true;
        updated = true;
      }

      if (updated) {
        await this.userRepository.save(user);
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        provider: user.provider,
        isNewUser,
        createdAt: user.createdAt,
      },
    } as AuthResponse;
  }

  async appleLogin(appleAuthDto: AppleAuthDto): Promise<AuthResponse> {
    const { identityToken, email: providedEmail, fullName } = appleAuthDto;

    // Verify Apple ID token
    const appleUser = await this.appleAuthService.verifyIdToken(identityToken);

    // Apple may not provide email on subsequent logins, use provided email or token email
    const email = appleUser.email || providedEmail;

    if (!email) {
      throw new BadRequestException('Email is required for Apple Sign-In');
    }

    // Find or create user
    let user = await this.userRepository.findOne({
      where: [
        { email, provider: 'apple' },
        { providerId: appleUser.sub, provider: 'apple' },
      ],
    });

    const isNewUser = !user;

    if (!user) {
      // Check if email exists with different provider
      const existingEmailUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingEmailUser && existingEmailUser.provider !== 'apple') {
        throw new ConflictException(
          `An account with this email already exists using ${existingEmailUser.provider} login`,
        );
      }

      // Create new user
      user = this.userRepository.create({
        email,
        provider: 'apple',
        providerId: appleUser.sub,
        displayName: fullName,
        isEmailVerified: appleUser.email_verified || false,
      });

      const savedUser = await this.userRepository.save(user);

      // Create default profile
      const profile = this.profileRepository.create({
        userId: savedUser.id,
        units: 'metric',
      });

      await this.profileRepository.save(profile);

      user = savedUser;
    } else {
      // Update user info if provided and changed
      let updated = false;

      if (fullName && user.displayName !== fullName) {
        user.displayName = fullName;
        updated = true;
      }

      if (appleUser.email_verified && !user.isEmailVerified) {
        user.isEmailVerified = true;
        updated = true;
      }

      if (updated) {
        await this.userRepository.save(user);
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        provider: user.provider,
        isNewUser,
        createdAt: user.createdAt,
      },
    } as AuthResponse;
  }

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // Store refresh token in Redis
    await this.redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      this.REFRESH_TOKEN_TTL,
    );

    return { accessToken, refreshToken };
  }
}
