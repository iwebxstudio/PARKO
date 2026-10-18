import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PricingService Unit Tests', () => {
  let service: PricingService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      pricingRule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      vehicleType: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRate', () => {
    it('should return rate 0 if no active pricing rule is found', async () => {
      prismaMock.pricingRule.findFirst.mockResolvedValue(null);

      const result = await service.getRate(1, 'DAILY');
      expect(result).toEqual({ rate: 0, pricingRuleId: '' });
    });

    it('should return daily rate for DAILY parking type', async () => {
      prismaMock.pricingRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        dailyRate: 15000,
        weeklyRate: 80000,
        monthlyRate: 300000,
        yearlyRate: 3000000,
      });

      const result = await service.getRate(1, 'DAILY');
      expect(result).toEqual({ rate: 15000, pricingRuleId: 'rule-1' });
    });

    it('should return weekly rate for WEEKLY parking type', async () => {
      prismaMock.pricingRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        dailyRate: 15000,
        weeklyRate: 80000,
        monthlyRate: 300000,
        yearlyRate: 3000000,
      });

      const result = await service.getRate(1, 'WEEKLY');
      expect(result).toEqual({ rate: 80000, pricingRuleId: 'rule-1' });
    });

    it('should return monthly rate for MONTHLY parking type', async () => {
      prismaMock.pricingRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        dailyRate: 15000,
        weeklyRate: 80000,
        monthlyRate: 300000,
        yearlyRate: 3000000,
      });

      const result = await service.getRate(1, 'MONTHLY');
      expect(result).toEqual({ rate: 300000, pricingRuleId: 'rule-1' });
    });

    it('should return yearly rate for YEARLY parking type', async () => {
      prismaMock.pricingRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        dailyRate: 15000,
        weeklyRate: 80000,
        monthlyRate: 300000,
        yearlyRate: 3000000,
      });

      const result = await service.getRate(1, 'YEARLY');
      expect(result).toEqual({ rate: 3000000, pricingRuleId: 'rule-1' });
    });
  });
});
