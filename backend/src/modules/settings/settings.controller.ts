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
@Roles(Role.ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  getAll() { return this.settingsService.getAll(); }

  @Get(':key')
  @ApiOperation({ summary: 'Get setting by key' })
  get(@Param('key') key: string) { return this.settingsService.get(key); }

  @Post()
  @ApiOperation({ summary: 'Set a setting value' })
  set(
    @Body() body: { key: string; value: any; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.settingsService.set(body.key, body.value, body.description || '', user.id);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a setting' })
  remove(@Param('key') key: string) { return this.settingsService.remove(key); }
}
