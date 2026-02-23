import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { PushSyncDto, PullSyncDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async pushChanges(@Request() req, @Body() pushSyncDto: PushSyncDto) {
    return this.syncService.pushChanges(req.user.id, pushSyncDto);
  }

  @Get('pull')
  async pullChanges(@Request() req, @Query('lastSync') lastSync?: string) {
    return this.syncService.pullChanges(req.user.id, lastSync);
  }

  @Get('last-sync')
  async getLastSync(@Request() req) {
    const timestamp = await this.syncService.getLastSyncTimestamp(req.user.id);
    return { timestamp };
  }
}
