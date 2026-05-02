// ============================================
// PARKO — Lost Ticket Controller
// ============================================
import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LostTicketService } from './lost-ticket.service';
import { CreateLostTicketDto, ResolveLostTicketDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('Lost Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
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
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.lostTicketService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lost ticket case by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lostTicketService.findOne(id);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Resolve a lost ticket case (Admin only)' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveLostTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.lostTicketService.resolve(id, dto, user.id);
  }
}
