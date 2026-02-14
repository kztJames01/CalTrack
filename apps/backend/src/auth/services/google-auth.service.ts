import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

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

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('oauth.google.clientId');
    this.oauth2Client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('oauth.google.clientId'),
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID token');
      }

      return {
        sub: payload.sub,
        email: payload.email!,
        email_verified: payload.email_verified || false,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      };
    } catch (error) {
      this.logger.error(`Google token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
}
