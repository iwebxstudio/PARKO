// ============================================
// PARKO — File Upload Service
// Secure image upload for lost ticket evidence
// ============================================
import {
  Injectable, BadRequestException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = configService.get('upload.dir') || './uploads';
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save uploaded file and return URL path
   */
  async saveFile(file: Express.Multer.File): Promise<string> {
    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    // Validate file size (5MB)
    const maxSize = this.configService.get('upload.maxFileSize') || 5242880;
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds ${maxSize / 1048576}MB limit`);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filepath, file.buffer);
    this.logger.log(`File uploaded: ${filename}`);

    return `/uploads/${filename}`;
  }
}
