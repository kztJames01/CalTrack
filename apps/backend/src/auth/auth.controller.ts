import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';
import { GoogleAuthDto, AppleAuthDto } from './dto/social-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 min
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleLogin(googleAuthDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleLogin(@Body() appleAuthDto: AppleAuthDto) {
    return this.authService.appleLogin(appleAuthDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req) {
    await this.authService.logout(req.user.id);
  }

  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been reset successfully' };
  }
}
