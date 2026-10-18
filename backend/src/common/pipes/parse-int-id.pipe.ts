// ============================================
// PARKO — Parse Integer ID Pipe
// ============================================
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
