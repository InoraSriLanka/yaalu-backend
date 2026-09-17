import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'yaalu_app',
      api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'yaalu_secret_key',
    });
  }

  async uploadImage(base64OrUrl: string, folder = 'yaalu/profiles'): Promise<{ url: string; publicId: string }> {
    if (!base64OrUrl) {
      throw new BadRequestException('Please provide a valid image file or base64 payload.');
    }

    // If already an HTTP/HTTPS web URL, return directly
    if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
      return { url: base64OrUrl, publicId: 'existing_url' };
    }

    try {
      const filePayload = base64OrUrl.startsWith('data:') ? base64OrUrl : `data:image/jpeg;base64,${base64OrUrl}`;

      const result: UploadApiResponse = await cloudinary.uploader.upload(filePayload, {
        folder: folder,
        resource_type: 'image',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      console.warn('[Cloudinary Service Upload Info]:', error?.message || error);
      return {
        url: base64OrUrl,
        publicId: 'upload_fallback',
      };
    }
  }
}
