import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('aws.s3.bucket') || '';

    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.s3.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('aws.s3.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('aws.s3.secretAccessKey') || '',
      },
    });
  }

  async uploadFoodPhoto(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ url: string; key: string }> {
    // Validate file
    this.validateImage(file);

    try {
      // Optimize and resize image
      const optimizedBuffer = await this.optimizeImage(file.buffer);

      // Generate unique key
      const key = this.generateKey(userId, file.originalname);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          userId,
          originalName: file.originalname,
        },
      });

      await this.s3Client.send(command);

      // Generate public or signed URL
      const url = `https://${this.bucket}.s3.${this.configService.get<string>('aws.s3.region')}.amazonaws.com/${key}`;

      this.logger.log(`Photo uploaded: ${key}`);

      return { url, key };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload photo');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 80,
          progressive: true,
        })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Image optimization failed: ${error.message}`);
      throw new BadRequestException('Invalid image file');
    }
  }

  private validateImage(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }
  }

  private generateKey(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = 'jpg'; // Always use jpg after optimization
    return `food-photos/${userId}/${timestamp}-${randomString}.${extension}`;
  }
}
