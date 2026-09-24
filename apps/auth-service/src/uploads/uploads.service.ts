import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }


  async uploadImage(file: any, folderName = 'yaalu/riders'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed:', error);
            return reject(error || new Error('Upload result is undefined'));
          }
          this.logger.log(`Uploaded file to Cloudinary: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );
      uploadStream.end(file.buffer);
    });
  }
}
