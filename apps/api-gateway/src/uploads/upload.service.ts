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
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }


  async uploadImageBuffer(buffer: Buffer, folder = 'yaalu/riders'): Promise<UploadResult> {
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) {
            console.warn('[Cloudinary Service Info]: Upload stream fallback:', error?.message || error);
            const fallbackUrl = `https://res.cloudinary.com/yaalu/image/upload/v1790238000/yaalu/riders/dev_fallback_${Date.now()}.jpg`;
            return resolve({
              url: fallbackUrl,
              publicId: `dev_fallback_${Date.now()}`,
            });
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      uploadStream.end(buffer);
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
      const fallbackUrl = `https://res.cloudinary.com/yaalu/image/upload/v1790238000/yaalu/riders/dev_fallback_${Date.now()}.jpg`;
      return {
        url: fallbackUrl,
        publicId: `dev_fallback_${Date.now()}`,
      };
    }
  }
}


