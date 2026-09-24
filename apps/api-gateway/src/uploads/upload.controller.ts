import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService, UploadResult } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file?: any,
    @Body('image') image?: string,
    @Body('file') fileBody?: string,
    @Body('folder') folder?: string,
  ): Promise<UploadResult> {
    const folderName = folder || 'yaalu/riders';
    if (file && file.buffer) {
      return this.uploadService.uploadImageBuffer(file.buffer, folderName);
    }
    const content = image || fileBody;
    if (content) {
      return this.uploadService.uploadImage(content, folderName);
    }
    throw new BadRequestException('No image file or base64 image string provided.');
  }
}

