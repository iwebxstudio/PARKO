import { Module } from '@nestjs/common';
import { LostTicketService } from './lost-ticket.service';
import { LostTicketController } from './lost-ticket.controller';

@Module({
  controllers: [LostTicketController],
  providers: [LostTicketService],
  exports: [LostTicketService],
})
export class LostTicketModule {}
