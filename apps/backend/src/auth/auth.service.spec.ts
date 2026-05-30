import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { AppleAuthService } from './services/apple-auth.service';
import { User, UserProfile } from '../database/entities';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};

describe('AuthService social login', () => {
  let service: AuthService;
  let userRepo: any;
  let profileRepo: any;
  let googleAuth: any;
  let appleAuth: any;
  let jwtService: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'user-1', createdAt: new Date(), ...x })),
    };
    profileRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(),
    };
    googleAuth = {
      verifyIdToken: jest.fn(),
    };
    appleAuth = {
      verifyIdToken: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(() => 'signed-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserProfile), useValue: profileRepo },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'jwt-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
              return null;
            }),
          },
        },
        { provide: 'default_IORedisModuleConnectionToken', useValue: mockRedis },
        { provide: GoogleAuthService, useValue: googleAuth },
        { provide: AppleAuthService, useValue: appleAuth },
      ],
    }).compile();

    service = module.get(AuthService);
    mockRedis.set.mockResolvedValue('OK');
  });

  it('googleLogin creates user and returns tokens for new user', async () => {
    googleAuth.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'g@test.com',
      email_verified: true,
      name: 'G User',
      picture: 'http://pic',
    });
    userRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const res = await service.googleLogin({ idToken: 'google-id-token' });

    expect(googleAuth.verifyIdToken).toHaveBeenCalledWith('google-id-token');
    expect(profileRepo.save).toHaveBeenCalled();
    expect(res.accessToken).toBe('signed-token');
    expect(res.user.email).toBe('g@test.com');
    expect(res.user.isNewUser).toBe(true);
  });

  it('googleLogin rejects when email used by another provider', async () => {
    googleAuth.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'x@test.com',
      email_verified: true,
    });
    userRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ email: 'x@test.com', provider: 'local' });

    await expect(service.googleLogin({ idToken: 't' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('appleLogin requires email when token has none', async () => {
    appleAuth.verifyIdToken.mockResolvedValue({ sub: 'apple-sub', email_verified: true });

    await expect(
      service.appleLogin({ identityToken: 'apple-token' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('appleLogin creates user when email provided', async () => {
    appleAuth.verifyIdToken.mockResolvedValue({
      sub: 'apple-sub',
      email: 'a@test.com',
      email_verified: true,
    });
    userRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const res = await service.appleLogin({
      identityToken: 'apple-token',
      fullName: 'Apple User',
    });

    expect(appleAuth.verifyIdToken).toHaveBeenCalledWith('apple-token');
    expect(res.user.email).toBe('a@test.com');
    expect(res.user.isNewUser).toBe(true);
  });
});
