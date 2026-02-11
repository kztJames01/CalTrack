export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    photoUrl?: string;
    provider?: string;
    isNewUser?: boolean;
    createdAt: Date;
  };
}
