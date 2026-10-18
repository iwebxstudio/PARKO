import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkingGateway } from './parking.gateway';
import {
  TicketStatus,
  ParkingType,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

describe('ParkingService Data Integrity & Transaction Regressions', () => {
  let parkingService: ParkingService;
  let prismaMock: any;
  let parkingGatewayMock: any;

  beforeEach(async () => {
    parkingGatewayMock = {
      broadcastUpdate: jest.fn(),
    };

    prismaMock = {
      vehicleType: {
        findUnique: jest.fn(),
      },
      parkingTicket: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      payment: {
        create: jest.fn(),
      },
      systemSetting: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      pricingRule: {
        findFirst: jest.fn(),
      },
      membership: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      // $transaction executes the callback with the mock tx client
      $transaction: jest.fn((callback: (tx: any) => Promise<any>) =>
        callback(prismaMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ParkingGateway, useValue: parkingGatewayMock },
      ],
    }).compile();

    parkingService = module.get<ParkingService>(ParkingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn Transaction Boundaries', () => {
    it('should rollback check-in transaction if prepaid payment creation fails', async () => {
      prismaMock.vehicleType.findUnique.mockResolvedValue({
        id: 1,
        name: 'CAR',
        label: 'Car',
      });
      prismaMock.pricingRule.findFirst.mockResolvedValue({ dailyRate: 20000 });
      prismaMock.parkingTicket.findFirst.mockResolvedValue(null);
      prismaMock.parkingTicket.findUnique.mockResolvedValue(null);

      // Ticket creation succeeds
      prismaMock.parkingTicket.create.mockResolvedValue({
        id: 'ticket-uuid-1',
        ticketNumber: '12345',
        vehicleType: { name: 'CAR' },
        checkInAt: new Date(),
      });

      // Payment creation fails (e.g. database constraint error)
      prismaMock.payment.create.mockRejectedValue(
        new Error('Payment constraint violation'),
      );

      await expect(
        parkingService.checkIn(
          {
            vehicleTypeId: 1,
            parkingType: ParkingType.DAILY,
            plateNumber: '1234',
            plateLetters: 'กข',
          } as any,
          'user-uuid',
        ),
      ).rejects.toThrow('Payment constraint violation');

      // Verify that $transaction was called
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should create ticket and payment atomically on prepaid check-in', async () => {
      prismaMock.vehicleType.findUnique.mockResolvedValue({
        id: 1,
        name: 'CAR',
        label: 'Car',
      });
      prismaMock.pricingRule.findFirst.mockResolvedValue({ dailyRate: 20000 });
      prismaMock.parkingTicket.findFirst.mockResolvedValue(null);
      prismaMock.parkingTicket.findUnique.mockResolvedValue(null);

      const mockTicket = {
        id: 'ticket-uuid-1',
        ticketNumber: '12345',
        vehicleType: { name: 'CAR' },
        checkInAt: new Date(),
        plateNumber: '1234',
      };
      prismaMock.parkingTicket.create.mockResolvedValue(mockTicket);
      prismaMock.payment.create.mockResolvedValue({ id: 'payment-1' });

      const result = await parkingService.checkIn(
        {
          vehicleTypeId: 1,
          parkingType: ParkingType.DAILY,
          plateNumber: '1234',
          plateLetters: 'กข',
        },
        'user-uuid',
      );

      expect(result.ticketNumber).toBe('12345');
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 'ticket-uuid-1',
            amount: 20000,
            paymentMethod: 'CASH',
            receivedById: 'user-uuid',
          }),
        }),
      );
    });
  });

  describe('checkOut Concurrency & Race Condition Defense', () => {
    it('should reject double check-out if another cashier completed the ticket concurrently', async () => {
      // Step 1: Initial query finds ticket active
      prismaMock.parkingTicket.findFirst.mockResolvedValue({
        id: 'ticket-uuid-1',
        ticketNumber: '12345',
        status: TicketStatus.ACTIVE,
        parkingType: ParkingType.DAILY,
        checkInAt: new Date(Date.now() - 3600000),
        vehicleType: { name: 'CAR', pricingRules: [] },
      });

      // Step 2: Inside transaction, ticket is found to be ALREADY COMPLETED (concurrently finished)
      prismaMock.parkingTicket.findUnique.mockResolvedValue({
        id: 'ticket-uuid-1',
        ticketNumber: '12345',
        status: TicketStatus.COMPLETED, // Already checked out!
      });

      await expect(
        parkingService.checkOut(
          {
            identifier: '12345',
            paymentMethod: PaymentMethod.CASH,
            amountPaid: 20000,
          } as any,
          'cashier-uuid-2',
        ),
      ).rejects.toThrow(BadRequestException);

      // Verify payment was NOT created for the duplicate checkout
      expect(prismaMock.payment.create).not.toHaveBeenCalled();
    });

    it('should atomically complete ticket and record payment on valid checkout', async () => {
      const activeTicket = {
        id: 'ticket-uuid-1',
        ticketNumber: '12345',
        status: TicketStatus.ACTIVE,
        parkingType: ParkingType.DAILY,
        checkInAt: new Date(Date.now() - 3600000),
        vehicleType: { name: 'CAR', pricingRules: [] },
      };

      prismaMock.parkingTicket.findFirst.mockResolvedValue(activeTicket);
      prismaMock.parkingTicket.findUnique.mockResolvedValue(activeTicket);

      const completedTicket = {
        ...activeTicket,
        status: TicketStatus.COMPLETED,
        checkOutAt: new Date(),
        totalAmount: 20000,
        paymentStatus: PaymentStatus.PAID,
      };
      prismaMock.parkingTicket.update.mockResolvedValue(completedTicket);
      prismaMock.payment.create.mockResolvedValue({ id: 'payment-1' });

      const result = await parkingService.checkOut(
        {
          identifier: '12345',
          paymentMethod: PaymentMethod.CASH,
          amountPaid: 20000,
        },
        'cashier-uuid',
      );

      expect(result.status).toBe(TicketStatus.COMPLETED);
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.parkingTicket.update).toHaveBeenCalled();
      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 'ticket-uuid-1',
            amount: 20000,
            paymentMethod: PaymentMethod.CASH,
            receivedById: 'cashier-uuid',
          }),
        }),
      );
    });
  });
});
