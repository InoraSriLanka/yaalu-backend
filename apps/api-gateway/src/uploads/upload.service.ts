import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export const MAX_PROFILE_PIC_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit for security

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
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

    // Security check: Enforce maximum 5MB file size limit for image uploads
    const base64Data = base64OrUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const estimatedSizeBytes = (base64Data.length * 3) / 4;

    if (estimatedSizeBytes > MAX_PROFILE_PIC_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds maximum allowed limit of 5MB for profile picture uploads. (Provided ~${(estimatedSizeBytes / (1024 * 1024)).toFixed(2)}MB)`
      );
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
