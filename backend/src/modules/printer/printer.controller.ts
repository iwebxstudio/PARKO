import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrinterService } from './printer.service';

@ApiTags('Printer')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('printer')
export class PrinterController {
  constructor(private printerService: PrinterService) {}

  @Get('receipt/:ticketId')
  @ApiOperation({ summary: 'Get receipt data for printing' })
  getReceiptData(@Param('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.printerService.generateReceiptData(ticketId);
  }
}
