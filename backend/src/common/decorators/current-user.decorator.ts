// ==============================================================================
// PARKO — ຕົວກຳນົດຂໍ້ມູນຜູ້ໃຊ້ງານປັດຈຸບັນ (Current User Decorator)
// ດຶງຂໍ້ມູນຜູ້ໃຊ້ງານ (Payload) ອອກມາຈາກ Request Context ທີ່ຜ່ານການກວດສອບ JWT ແລ້ວ
// ==============================================================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
