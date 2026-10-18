// ==============================================================================
// PARKO — ໄປປ໌ແປງ ແລະ ກວດສອບລະຫັດເລກເຕັມ (Parse Integer ID Pipe)
// ກວດສອບຄວາມຖືກຕ້ອງຂອງພາລາມິເຕີ ID ໃນ URL ວ່າເປັນຈຳນວນຖ້ວນບວກ (Positive Integer) ແທ້ຫຼືບໍ່
// ==============================================================================
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
      throw new BadRequestException(
        `ID must be a positive integer, received: "${value}"`,
      );
    }
    return val;
  }
}
