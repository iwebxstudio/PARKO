// ============================================
// PARKO — File Upload Service
// Secure image upload for lost ticket evidence
// ============================================
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

function detectImageType(
  buffer: Buffer,
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

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
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file buffer is empty');
    }

    // Validate file type header
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    // Deep inspection: verify file signature (magic bytes)
    const detectedType = detectImageType(file.buffer);
    if (!detectedType || detectedType !== file.mimetype) {
      throw new BadRequestException(
        'Invalid file content: signature does not match image format',
      );
    }

    // Validate file size (5MB default)
    const maxSize = this.configService.get('upload.maxFileSize') || 5242880;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSize / 1048576}MB limit`,
      );
    }

    // Strict extension mapping from validated MIME type (never trust client originalname)
    const ext = MIME_TO_EXTENSION[detectedType];
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filepath, file.buffer);
    this.logger.log(`File uploaded: ${filename}`);

    return `/uploads/${filename}`;
  }
}
