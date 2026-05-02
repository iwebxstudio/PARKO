import { Module } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { ParkingController } from './parking.controller';
import { ParkingGateway } from './parking.gateway';

@Module({
  controllers: [ParkingController],
  providers: [ParkingService, ParkingGateway],
  exports: [ParkingService, ParkingGateway],
})
export class ParkingModule {}
