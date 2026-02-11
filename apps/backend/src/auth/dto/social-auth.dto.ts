import { IsString, IsEmail, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  idToken: string;
}

export class AppleAuthDto {
  @IsString()
  identityToken: string;

  @IsOptional()
  @IsString()
  authorizationCode?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class SocialAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    photoUrl?: string;
    provider: string;
    isNewUser: boolean;
  };
}
