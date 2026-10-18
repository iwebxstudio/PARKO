// ==============================================================================
// PARKO — ບໍລິການອັບໂຫຼດໄຟລ໌ (File Upload Service)
// ລະບົບອັບໂຫຼດຮູບພາບຫຼັກຖານປີ້ເສຍ ຫຼື ຮູບພາບລົດ ພ້ອມລະບົບກວດສອບ Magic Bytes ເພື່ອຄວາມປອດໄພສູງສຸດ
// ==============================================================================
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

function detectImageType(
  buffer: Buffer,
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (!buffer || buffer.length < 12) return null;
  // ຮູບແບບ JPEG: ເລີ່ມຕົ້ນດ້ວຍ Magic Bytes ຄື FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // ຮູບແບບ PNG: ເລີ່ມຕົ້ນດ້ວຍ Magic Bytes ຄື 89 50 4E 47 0D 0A 1A 0A
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
  // ຮູບແບບ WebP: ປະກອບດ້ວຍ RIFF (ໄບຕ໌ 0-3) ແລະ WEBP (ໄບຕ໌ 8-11)
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
    // ກວດສອບ ແລະ ສ້າງໂຟນເດີ uploads ຖ້າຍັງບໍ່ທັນມີຢູ່ໃນລະບົບ
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * ບັນທຶກໄຟລ໌ຮູບພາບທີ່ອັບໂຫຼດລົງໃນ Server ແລະ ສົ່ງຄືນ URL Path ສຳລັບເຂົ້າເຖິງ
   */
  async saveFile(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file buffer is empty');
    }

    // ກວດສອບປະເພດ MIME Type ຈາກ Header ວ່າຢູ່ໃນລາຍການທີ່ອະນຸຍາດຫຼືບໍ່
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    // ກວດສອບລົງເລິກເຖິງໂຄງສ້າງໄຟລ໌ຕົວຈິງ (Magic Bytes) ເພື່ອປ້ອງກັນການປອມແປງນາມສະກຸນ
    const detectedType = detectImageType(file.buffer);
    if (!detectedType || detectedType !== file.mimetype) {
      throw new BadRequestException(
        'Invalid file content: signature does not match image format',
      );
    }

    // ກວດສອບຂະໜາດໄຟລ໌ບໍ່ໃຫ້ເກີນກຳນົດ (ຄ່າເລີ່ມຕົ້ນສູງສຸດ 5MB)
    const maxSize = this.configService.get('upload.maxFileSize') || 5242880;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSize / 1048576}MB limit`,
      );
    }

    // ກຳນົດນາມສະກຸນໄຟລ໌ຈາກ MIME Type ທີ່ຜ່ານການກວດສອບ Magic Bytes ແທ້ຈິງ (ບໍ່ເຊື່ອຖື originalname ຈາກ Client)
    const ext = MIME_TO_EXTENSION[detectedType];
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filepath, file.buffer);
    this.logger.log(`File uploaded: ${filename}`);

    return `/uploads/${filename}`;
  }
}
