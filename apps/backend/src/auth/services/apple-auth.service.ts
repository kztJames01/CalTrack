import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';
import { CacheService } from '../../common/cache/cache.service';

export interface AppleTokenPayload {
  sub: string; // User ID
  email?: string;
  email_verified?: boolean;
  is_private_email?: boolean;
  real_user_status?: number;
}

@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {}

  async verifyIdToken(idToken: string): Promise<AppleTokenPayload> {
    const cacheKey = `oauth:apple:${this.cacheService.hashKey(idToken)}`;
    const cached = await this.cacheService.get<AppleTokenPayload>(cacheKey);
    if (cached) return cached;

    try {
      const clientId = this.configService.get<string>('oauth.apple.clientId');

      const result = await appleSignin.verifyIdToken(
        idToken,
        {
          audience: clientId,
          // Optional: specify issuer and other options
          ignoreExpiration: false,
        },
      );

      const emailVerified = result.email_verified === true || result.email_verified === 'true';
      const isPrivateEmail = result.is_private_email === true || result.is_private_email === 'true';

      const payload = {
        sub: result.sub,
        email: result.email,
        email_verified: emailVerified,
        is_private_email: isPrivateEmail,
      };
      await this.cacheService.set(cacheKey, payload, 300);
      return payload;
    } catch (error) {
      this.logger.error(`Apple token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Apple ID token');
    }
  }

  async verifyAuthorizationCode(
    authorizationCode: string,
  ): Promise<{ id_token: string; refresh_token?: string }> {
    try {
      const clientId = this.configService.get<string>('oauth.apple.clientId');
      const teamId = this.configService.get<string>('oauth.apple.teamId');
      const keyId = this.configService.get<string>('oauth.apple.keyId');
      const privateKey = this.configService.get<string>('oauth.apple.privateKey');

      const clientSecret = appleSignin.getClientSecret({
        clientID: clientId!,
        teamID: teamId!,
        keyIdentifier: keyId!,
        privateKey: privateKey!,
      });

      const response = await appleSignin.getAuthorizationToken(authorizationCode, {
        clientID: clientId!,
        clientSecret,
        redirectUri: this.configService.get<string>('oauth.apple.redirectUri') || '',
      });

      return {
        id_token: response.id_token,
        refresh_token: response.refresh_token,
      };
    } catch (error) {
      this.logger.error(`Apple authorization code verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Apple authorization code');
    }
  }
}
