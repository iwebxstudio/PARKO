// ==============================================================================
// PARKO — ຕົວກຳນົດສິດການເຂົ້າເຖິງຕາມບົດບາດ (Roles Decorator)
// Custom Decorator ສຳລັບກຳນົດສິດ (ADMIN, STAFF) ໃຫ້ກັບ Route Handlers ແຕ່ລະຕົວ
// ==============================================================================
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
