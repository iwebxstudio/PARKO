import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService Security Regressions', () => {
  let authService: AuthService;
  let prismaService: any;

  const mockActiveUser = {
    id: 'user-uuid-1',
    username: 'staff01',
    email: 'staff01@parko.com',
    phoneNumber: '02012345678',
    passwordHash: '',
    isActive: true,
    role: 'STAFF',
  };

  beforeAll(async () => {
    // ສ້າງລະຫັດຜ່ານແບບເຂົ້າລະຫັດ bcrypt hash ທີ່ຖືກຕ້ອງສຳລັບການທົດສອບຄວາມປອດໄພ
    mockActiveUser.passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
  });

  beforeEach(async () => {
    prismaService = {
      user: {
        findFirst: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'jwt.refreshExpiresIn') return '7d';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should reject non-existent username without revealing user existence', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);

    await expect(
      authService.validateUser('ghost_user', 'any_pass'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject inactive/disabled user accounts', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      ...mockActiveUser,
      isActive: false,
    });

    await expect(
      authService.validateUser('staff01', 'CorrectPassword123!'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject incorrect password', async () => {
    prismaService.user.findFirst.mockResolvedValue(mockActiveUser);

    await expect(
      authService.validateUser('staff01', 'WrongPassword!'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject backdoor/default passwords when database hash differs', async () => {
    prismaService.user.findFirst.mockResolvedValue(mockActiveUser);

    const backdoorAttempts = [
      'admin',
      'password',
      '123456',
      'superadmin',
      'demo123',
    ];

    for (const attempt of backdoorAttempts) {
      await expect(
        authService.validateUser('staff01', attempt),
      ).rejects.toThrow(UnauthorizedException);
    }
  });

  it('should authenticate successfully with correct credentials', async () => {
    prismaService.user.findFirst.mockResolvedValue(mockActiveUser);

    const user = await authService.validateUser(
      'staff01',
      'CorrectPassword123!',
    );
    expect(user).toBeDefined();
    expect(user.id).toBe(mockActiveUser.id);
  });
});
