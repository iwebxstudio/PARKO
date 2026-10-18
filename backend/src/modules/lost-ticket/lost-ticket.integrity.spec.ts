import { Test, TestingModule } from '@nestjs/testing';
import { LostTicketService } from './lost-ticket.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketStatus, LostTicketResolution } from '@prisma/client';

describe('LostTicketService Data Integrity & Transaction Regressions', () => {
  let service: LostTicketService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      parkingTicket: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      lostTicketCase: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: any) => Promise<any>) =>
        callback(prismaMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LostTicketService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<LostTicketService>(LostTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create lost ticket case and update ticket status atomically inside transaction', async () => {
    prismaMock.parkingTicket.findUnique.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: '10001',
      status: TicketStatus.ACTIVE,
    });

    prismaMock.parkingTicket.update.mockResolvedValue({
      id: 'ticket-1',
      status: TicketStatus.LOST,
    });

    prismaMock.lostTicketCase.create.mockResolvedValue({
      id: 'case-1',
      ticketId: 'ticket-1',
      notes: 'Customer lost ticket card',
      penaltyAmount: 50000,
    });

    const result = await service.create(
      {
        ticketId: 'ticket-1',
        notes: 'Customer lost ticket card',
        penaltyAmount: 50000,
      },
      'staff-1',
    );

    expect(result.id).toBe('case-1');
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.parkingTicket.update).toHaveBeenCalledWith({
      where: { id: 'ticket-1' },
      data: { status: TicketStatus.LOST },
    });
  });

  it('should atomically complete ticket and record penalty payment upon case resolution', async () => {
    const existingCase = {
      id: 'case-1',
      ticketId: 'ticket-1',
      resolution: LostTicketResolution.PENDING,
      penaltyAmount: 50000,
      ticket: { id: 'ticket-1', vehicleType: { name: 'CAR' } },
      staff: { displayName: 'Staff A' },
      resolvedBy: null,
    };

    prismaMock.lostTicketCase.findUnique.mockResolvedValue(existingCase);
    prismaMock.lostTicketCase.update.mockResolvedValue({
      ...existingCase,
      resolution: LostTicketResolution.RESOLVED,
      penaltyAmount: 50000,
    });
    prismaMock.parkingTicket.update.mockResolvedValue({
      id: 'ticket-1',
      status: TicketStatus.COMPLETED,
    });
    prismaMock.payment.create.mockResolvedValue({ id: 'pay-1' });

    const result = await service.resolve(
      'case-1',
      {
        resolution: LostTicketResolution.RESOLVED,
        penaltyAmount: 50000,
      },
      'admin-1',
    );

    expect(result.resolution).toBe(LostTicketResolution.RESOLVED);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.parkingTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ticket-1' },
        data: expect.objectContaining({
          status: TicketStatus.COMPLETED,
          totalAmount: 50000,
          paymentStatus: 'PAID',
        }),
      }),
    );
    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketId: 'ticket-1',
          amount: 50000,
          paymentMethod: 'CASH',
          receivedById: 'admin-1',
        }),
      }),
    );
  });
});
