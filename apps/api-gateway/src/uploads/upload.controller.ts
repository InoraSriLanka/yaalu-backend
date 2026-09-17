import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload an image to Cloudinary CDN' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully to Cloudinary' })
  uploadImage(@Body() body: any) {
    const imagePayload = typeof body === 'string' ? body : (body?.image || body?.base64 || body?.file);
    const folder = body?.folder || 'yaalu/profiles';
    return this.uploadService.uploadImage(imagePayload, folder);
  }
}
