import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('food-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadFoodPhoto(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadService.uploadFoodPhoto(file, req.user.id);
  }

  // alias for mobile client
  @Post('photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhotoAlias(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadFoodPhoto(req, file);
  }
}
