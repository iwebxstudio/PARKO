// ============================================
// ລະບົບ PARKO — Users Service (ການບໍລິການຈັດການບັນຊີຜູ້ໃຊ້ງານ)
// ປະຕິບັດການ CRUD, ການຈັດການລະຫັດຜ່ານ ແລະ ການກຳນົດສິດທິຜູ້ໃຊ້ງານລະບົບ
// ============================================
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  ResetPasswordDto,
} from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * ສ້າງບັນຊີຜູ້ໃຊ້ງານໃໝ່ໃນລະບົບ (Create User)
   */
  async create(dto: CreateUserDto) {
    // ກວດສອບຄວາມຊ້ຳຊ້ອນຂອງຊື່ຜູ້ໃຊ້ (Username) ຫຼື ອີເມວ (Email) ວ່າເຄີຍມີໃນລະບົບແລ້ວຫຼືບໍ່
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        role: dto.role || 'STAFF',
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    this.logger.log(`User created: ${user.username}`);
    return user;
  }

  /**
   * ດຶງລາຍຊື່ຜູ້ໃຊ້ງານທັງໝົດໃນລະບົບ ພ້ອມດ້ວຍການແບ່ງໜ້າ (Pagination)
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ຄົ້ນຫາ ແລະ ດຶງຂໍ້ມູນຜູ້ໃຊ້ງານຕາມລະຫັດປະຈຳຕົວ (User ID)
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * ອັບເດດຂໍ້ມູນລາຍລະອຽດຂອງຜູ້ໃຊ້ງານ
   */
  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * ປ່ຽນລະຫັດຜ່ານຂອງຕົນເອງ ໂດຍຕ້ອງຢືນຢັນລະຫັດຜ່ານເດີມກ່ອນ
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid)
      throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * ຜູ້ດູແລລະບົບ (Admin) ຣີເຊັດລະຫັດຜ່ານໃໝ່ໃຫ້ກັບຜູ້ໃຊ້ງານ
   */
  async resetPassword(userId: string, dto: ResetPasswordDto) {
    await this.findById(userId);

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * ລຶບບັນຊີຜູ້ໃຊ້ງານຖາວອນ (Hard Delete) ພ້ອມຈັດການຄວາມສຳພັນໃນຖານຂໍ້ມູນຢ່າງປອດໄພ
   */
  async remove(id: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('ບໍ່ສາມາດລຶບບັນຊີຂອງຕົນເອງທີ່ກຳລັງເຂົ້າສູ່ລະບົບຢູ່ໄດ້');
    }

    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('ບໍ່ສາມາດລຶບຜູ້ບໍລິຫານຄົນສຸດທ້າຍໃນລະບົບໄດ້');
      }
    }

    // ຊອກຫາຜູ້ບໍລິຫານ ຫຼື ຜູ້ໃຊ້ງານອື່ນສຳລັບໂອນຍ້າຍ Foreign Key ທີ່ຈຳເປັນ
    const fallbackUser = currentUserId
      ? await this.prisma.user.findUnique({ where: { id: currentUserId } })
      : (await this.prisma.user.findFirst({
          where: { id: { not: id }, role: 'ADMIN' },
        })) ||
        (await this.prisma.user.findFirst({
          where: { id: { not: id } },
        }));

    await this.prisma.$transaction(async (tx) => {
      // 1. ລຶບ Refresh Tokens
      await tx.refreshToken.deleteMany({ where: { userId: id } });

      // 2. ຕັດການເຊື່ອມໂຍງ Nullable Foreign Keys
      await tx.auditLog.updateMany({
        where: { userId: id },
        data: { userId: null },
      });
      await tx.systemSetting.updateMany({
        where: { updatedById: id },
        data: { updatedById: null },
      });
      await tx.lostTicketCase.updateMany({
        where: { resolvedById: id },
        data: { resolvedById: null },
      });
      await tx.parkingTicket.updateMany({
        where: { checkedOutById: id },
        data: { checkedOutById: null },
      });

      // 3. ໂອນຍ້າຍ Foreign Keys ທີ່ບໍ່ອະນຸຍາດໃຫ້ເປັນ Null ໄປຫາ Fallback Admin/User
      if (fallbackUser) {
        await tx.parkingTicket.updateMany({
          where: { checkedInById: id },
          data: { checkedInById: fallbackUser.id },
        });
        await tx.payment.updateMany({
          where: { receivedById: id },
          data: { receivedById: fallbackUser.id },
        });
        await tx.membership.updateMany({
          where: { createdById: id },
          data: { createdById: fallbackUser.id },
        });
        await tx.lostTicketCase.updateMany({
          where: { staffId: id },
          data: { staffId: fallbackUser.id },
        });
      }

      // 4. ລຶບບັນຊີຜູ້ໃຊ້ງານອອກຈາກຖານຂໍ້ມູນຖາວອນ
      await tx.user.delete({
        where: { id },
      });
    });

    this.logger.log(`User deleted permanently: ${user.username} (${user.id})`);
    return { success: true, message: 'ລຶບຜູ້ໃຊ້ງານຖາວອນສຳເລັດແລ້ວ' };
  }
}
