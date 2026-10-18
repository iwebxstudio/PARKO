// ============================================
// PARKO — Auth Service
// Handles JWT authentication & refresh tokens
// ============================================
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validate user credentials
   */
  async validateUser(usernameOrContact: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrContact },
          { email: usernameOrContact },
          { phoneNumber: usernameOrContact },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials or account disabled',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const isPasswordValid = await bcrypt
      .compare(pass, user.passwordHash)
      .catch(() => false);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Login — generate access + refresh tokens
   */
  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessExpiration'),
    });

    const refreshToken = randomUUID();
    const refreshExpiration = this.configService.get('jwt.refreshExpiration');

    // Calculate expiration date for refresh token
    const expiresAt = new Date();
    const days = parseInt(refreshExpiration) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    // Save refresh token to database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    this.logger.log(`User ${user.username} logged in successfully`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation for security
   */
  async refreshAccessToken(refreshTokenStr: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const payload = {
      sub: storedToken.user.id,
      username: storedToken.user.username,
      role: storedToken.user.role,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessExpiration'),
    });

    const newRefreshToken = randomUUID();
    const refreshExpiration = this.configService.get('jwt.refreshExpiration');
    const expiresAt = new Date();
    const days = parseInt(refreshExpiration) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        username: storedToken.user.username,
        displayName: storedToken.user.displayName,
        role: storedToken.user.role,
      },
    };
  }

  /**
   * Logout — revoke refresh token
   */
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  async register(dto: any) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
          { phoneNumber: dto.phoneNumber },
        ],
      },
    });
    if (existing) {
      throw new UnauthorizedException(
        'User with this username, email or phone already exists',
      );
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        displayName: dto.displayName || dto.username,
        passwordHash,
        role: 'STAFF', // Default to STAFF
      },
    });
    const result = { ...user };
    delete (result as Record<string, any>).passwordHash;
    return result;
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
