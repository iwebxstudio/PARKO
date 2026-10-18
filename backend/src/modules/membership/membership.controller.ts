// ============================================
// PARKO — Membership Controller
// ============================================
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { MembershipService } from './membership.service';
import { CreateMembershipDto, UpdateMembershipDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Membership')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new membership (Admin)' })
  create(@Body() dto: CreateMembershipDto, @CurrentUser() user: any) {
    return this.membershipService.create(dto, user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all memberships' })
  findAll() {
    return this.membershipService.findAll();
  }

  @Get('check/:plate')
  @ApiOperation({ summary: 'Check active membership by plate number' })
  checkByPlate(@Param('plate') plate: string) {
    return this.membershipService.checkByPlate(plate);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get membership by ID' })
  findOne(@Param('id') id: string) {
    return this.membershipService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a membership (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.membershipService.update(id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cancel a membership (Admin)' })
  cancel(@Param('id') id: string) {
    return this.membershipService.cancel(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a membership (Admin)' })
  remove(@Param('id') id: string) {
    return this.membershipService.remove(id);
  }
}
