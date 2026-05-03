import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all settings' })
  getAll() { return this.settingsService.getAll(); }

  @Get(':key')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get setting by key' })
  get(@Param('key') key: string) { return this.settingsService.get(key); }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set a setting value' })
  set(
    @Body() body: { key: string; value: any; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.settingsService.set(body.key, body.value, body.description || '', user.id);
  }

  @Delete(':key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a setting' })
  remove(@Param('key') key: string) { return this.settingsService.remove(key); }
}
