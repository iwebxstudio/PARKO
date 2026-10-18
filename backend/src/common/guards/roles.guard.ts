// ==============================================================================
// PARKO — ລະບົບປ້ອງກັນການເຂົ້າເຖິງຕາມບົດບາດ (Roles Guard)
// ກວດສອບບົດບາດ (Role) ຂອງຜູ້ໃຊ້ງານທຽບກັບສິດທີ່ Endpoint ຕ້ອງການ
// ==============================================================================
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // ຖ້າຫາກ Endpoint ນີ້ບໍ່ໄດ້ກຳນົດສິດສະເພາະ ຈະອະນຸຍາດໃຫ້ເຂົ້າເຖິງໄດ້ທັນທີ
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}
