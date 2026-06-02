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
  private publicBaseUrl: string;
  private useB2: boolean;

  constructor(private configService: ConfigService) {
    const b2Bucket = this.configService.get<string>('b2.bucket');
    this.useB2 = Boolean(b2Bucket);

    if (this.useB2) {
      const endpoint = this.configService.get<string>('b2.endpoint') || '';
      this.bucket = b2Bucket!;
      this.publicBaseUrl =
        this.configService.get<string>('b2.publicBaseUrl') ||
        `${endpoint.replace(/\/$/, '')}/${this.bucket}`;

      this.s3Client = new S3Client({
        region: this.configService.get<string>('b2.region') || 'us-east-005',
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: this.configService.get<string>('b2.keyId') || '',
          secretAccessKey: this.configService.get<string>('b2.applicationKey') || '',
        },
      });
      this.logger.log(`Photo storage: Backblaze B2 bucket "${this.bucket}"`);
    } else {
      this.bucket = this.configService.get<string>('aws.s3.bucket') || '';
      const region = this.configService.get<string>('aws.s3.region') || 'us-east-1';
      this.publicBaseUrl = `https://${this.bucket}.s3.${region}.amazonaws.com`;

      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: this.configService.get<string>('aws.s3.accessKeyId') || '',
          secretAccessKey: this.configService.get<string>('aws.s3.secretAccessKey') || '',
        },
      });
      this.logger.log(`Photo storage: AWS S3 bucket "${this.bucket}"`);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.bucket);
  }

  async uploadFoodPhoto(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ url: string; photoUrl: string; key: string }> {
    if (!this.bucket) {
      throw new BadRequestException('Photo storage is not configured');
    }

    this.validateImage(file);

    try {
      const optimizedBuffer = await this.optimizeImage(file.buffer);
      const key = this.generateKey(userId, file.originalname);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimizedBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            userId,
            originalName: file.originalname,
          },
        }),
      );

      const url = await this.resolvePublicOrSignedUrl(key);
      this.logger.log(`Photo uploaded: ${key}`);

      return { url, photoUrl: url, key };
    } catch (error: any) {
      this.logger.error(`Upload failed: ${error?.message || error}`);
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

  private async resolvePublicOrSignedUrl(key: string): Promise<string> {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    return this.getSignedUrl(key, 60 * 60 * 24);
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
    } catch (error: any) {
      this.logger.error(`Image optimization failed: ${error?.message}`);
      throw new BadRequestException('Invalid image file');
    }
  }

  private validateImage(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

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
    return `food-photos/${userId}/${timestamp}-${randomString}.jpg`;
  }
}
