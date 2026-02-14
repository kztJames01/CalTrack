import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('oauth.google.clientId') || '',
      clientSecret: configService.get<string>('oauth.google.clientSecret') || '',
      callbackURL: configService.get<string>('oauth.google.callbackUrl') || '',
      scope: ['email', 'profile'],
    };
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const user = {
      providerId: id,
      email: emails[0].value,
      displayName: displayName,
      photoUrl: photos?.[0]?.value,
      provider: 'google',
    };

    done(null, user);
  }
}
