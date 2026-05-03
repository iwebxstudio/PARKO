// ============================================
// PARKO — Pricing Service
// CRUD for pricing rules per vehicle type
// ============================================
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePricingRuleDto, UpdatePricingRuleDto } from './dto';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePricingRuleDto) {
    return this.prisma.pricingRule.create({
      data: {
        vehicleTypeId: dto.vehicleTypeId,
        pricingType: dto.pricingType,
        basePrice: dto.basePrice || 0,
        hourlyRate: dto.hourlyRate || 0,
        dailyRate: dto.dailyRate || 0,
        weeklyRate: dto.weeklyRate || 0,
        monthlyRate: dto.monthlyRate || 0,
        freeMinutes: dto.freeMinutes || 0,
        isActive: dto.isActive ?? true,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
      include: { vehicleType: true },
    });
  }

  async findAll() {
    return this.prisma.pricingRule.findMany({
      include: { vehicleType: true },
      orderBy: [{ vehicleTypeId: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findByVehicleType(vehicleTypeId: number) {
    return this.prisma.pricingRule.findMany({
      where: { vehicleTypeId, isActive: true },
      include: { vehicleType: true },
    });
  }

  async update(id: string, dto: UpdatePricingRuleDto) {
    const existing = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pricing rule not found');

    return this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
      include: { vehicleType: true },
    });
  }

  async remove(id: string) {
    await this.prisma.pricingRule.delete({ where: { id } });
    return { message: 'Pricing rule deleted' };
  }

  async getVehicleTypes() {
    return this.prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get the rate for a specific vehicle type and parking type
   * Used by check-in to preview and lock-in the prepaid amount
   */
  async getRate(vehicleTypeId: number, parkingType: string): Promise<{ rate: number; pricingRuleId: string }> {
    const rule = await this.prisma.pricingRule.findFirst({
      where: { vehicleTypeId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!rule) {
      return { rate: 0, pricingRuleId: '' };
    }

    let rate = 0;
    switch (parkingType) {
      case 'DAILY':
        rate = Number(rule.dailyRate);
        break;
      case 'WEEKLY':
        rate = Number(rule.weeklyRate);
        break;
      case 'MONTHLY':
        rate = Number(rule.monthlyRate);
        break;
      default:
        rate = Number(rule.dailyRate);
    }

    return { rate, pricingRuleId: rule.id };
  }
}
