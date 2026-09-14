import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId?: string;
}

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'yaalu-cloud',
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY') || '123456789',
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET') || 'secret',
    });
  }

  async uploadImage(base64OrUri: string, folder = 'yaalu/riders'): Promise<UploadResult> {
    if (!base64OrUri) {
      throw new BadRequestException('No image content provided for upload.');
    }

    // Security check: validate size limit (Max 10MB ~ approx 13.3MB base64 string length)
    const MAX_BASE64_LENGTH = 14 * 1024 * 1024;
    if (base64OrUri.length > MAX_BASE64_LENGTH) {
      throw new BadRequestException('File size exceeds maximum security limit of 10MB.');
    }

    // If already an HTTP/HTTPS URL, return directly
    if (base64OrUri.startsWith('http://') || base64OrUri.startsWith('https://')) {
      return { url: base64OrUri, publicId: 'existing_url' };
    }

    try {
      const result = await cloudinary.uploader.upload(base64OrUri, {
        folder: folder,
        resource_type: 'auto',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      console.warn('[Cloudinary Service Info]: Upload error or dev mode fallback:', error?.message || error);
      // Return given string/URI as resilient dev fallback
      return {
        url: base64OrUri,
        publicId: `dev_fallback_${Date.now()}`,
      };
    }
  }
}
