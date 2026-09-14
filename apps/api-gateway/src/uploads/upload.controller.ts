import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { UploadService, UploadResult } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  async uploadImage(
    @Body('image') image: string,
    @Body('folder') folder?: string,
  ): Promise<UploadResult> {
    if (!image) {
      throw new BadRequestException('Property "image" is required.');
    }
    return this.uploadService.uploadImage(image, folder || 'yaalu/uploads');
  }
}
