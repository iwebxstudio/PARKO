// ============================================
// PARKO — Settings Service
// System settings key-value store
// ============================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async get(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting '${key}' not found`);
    return setting;
  }

  async set(key: string, value: any, description: string, userId: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, description, updatedById: userId },
      create: { key, value, description, updatedById: userId },
    });
  }

  async remove(key: string) {
    await this.prisma.systemSetting.delete({ where: { key } });
    return { message: `Setting '${key}' deleted` };
  }
}
