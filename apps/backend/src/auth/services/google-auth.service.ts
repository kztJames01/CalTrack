import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { CacheService } from '../../common/cache/cache.service';

export interface GoogleTokenPayload {
  sub: string; // User ID
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private oauth2Client: OAuth2Client;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    const clientId = this.configService.get<string>('oauth.google.clientId');
    this.oauth2Client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    const cacheKey = `oauth:google:${this.cacheService.hashKey(idToken)}`;
    try {
      const cached = await this.cacheService.get<GoogleTokenPayload>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(`Google token cache read skipped: ${err.message}`);
    }

    const audiences = [
      this.configService.get<string>('oauth.google.clientId'),
      this.configService.get<string>('oauth.google.iosClientId'),
    ].filter(Boolean) as string[];

    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: audiences.length === 1 ? audiences[0] : audiences,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID token');
      }

      const result = {
        sub: payload.sub,
        email: payload.email!,
        email_verified: payload.email_verified || false,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      };
      await this.cacheService.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`Google token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
}
