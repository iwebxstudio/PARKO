// ==============================================================================
// PARKO — ໂມດູນຄວບຄຸມກໍລະນີປີ້ເສຍ (Lost Ticket Controller)
// ຈັດການ Endpoints ສຳລັບການແຈ້ງ, ສອບຖາມ, ແກ້ໄຂ ແລະ ລຶບຂໍ້ມູນກໍລະນີປີ້ເສຍ
// ==============================================================================
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LostTicketService } from './lost-ticket.service';
import { CreateLostTicketDto, ResolveLostTicketDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '@prisma/client';

@ApiTags('Lost Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('lost-tickets')
export class LostTicketController {
  constructor(private lostTicketService: LostTicketService) {}

  @Post()
  @ApiOperation({ summary: 'Create a lost ticket case' })
  create(@Body() dto: CreateLostTicketDto, @CurrentUser() user: any) {
    return this.lostTicketService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lost ticket cases' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.lostTicketService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lost ticket case by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lostTicketService.findOne(id);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Resolve a lost ticket case' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveLostTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.lostTicketService.resolve(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a lost ticket case (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.lostTicketService.remove(id);
  }
}
