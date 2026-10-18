import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { FileUploadService } from './file-upload.service';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('FileUploadService Security Regressions', () => {
  let service: FileUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'upload.dir') return './uploads';
              if (key === 'upload.maxFileSize') return 5242880;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject file with missing or empty buffer', async () => {
    const invalidFile = {
      buffer: null,
      mimetype: 'image/jpeg',
      size: 0,
      originalname: 'test.jpg',
    } as any;

    await expect(service.saveFile(invalidFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject disallowed MIME type even if originalname says .jpg', async () => {
    const maliciousFile = {
      buffer: Buffer.from('<?php echo "pwned"; ?>'),
      mimetype: 'application/x-php',
      size: 100,
      originalname: 'shell.jpg',
    } as any;

    await expect(service.saveFile(maliciousFile)).rejects.toThrow(
      'Only JPEG, PNG, and WebP images are allowed',
    );
  });

  it('should reject spoofed MIME type when file magic bytes do not match', async () => {
    // ແຈ້ງວ່າເປັນ image/jpeg ແຕ່ເນື້ອໃນພາຍໃນເປັນ Script ທີ່ບໍ່ຖືກຕ້ອງ
    const spoofedFile = {
      buffer: Buffer.from('malicious shell script disguised as image'),
      mimetype: 'image/jpeg',
      size: 100,
      originalname: 'fake.jpg',
    } as any;

    await expect(service.saveFile(spoofedFile)).rejects.toThrow(
      'Invalid file content: signature does not match image format',
    );
  });

  it('should reject file exceeding maximum size limit', async () => {
    // Header ມາດຕະຖານຂອງໄຟລ໌ PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
    ]);
    const oversizedFile = {
      buffer: pngHeader,
      mimetype: 'image/png',
      size: 10 * 1024 * 1024, // ຂະໜາດ 10MB ເຊິ່ງເກີນຂີດຈຳກັດ 5MB
      originalname: 'large.png',
    } as any;

    await expect(service.saveFile(oversizedFile)).rejects.toThrow(
      'File size exceeds 5MB limit',
    );
  });

  it('should save valid PNG image and enforce safe extension derived from magic bytes', async () => {
    // Header ທີ່ຖືກຕ້ອງຂອງໄຟລ໌ PNG
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const validFile = {
      buffer: validPngBuffer,
      mimetype: 'image/png',
      size: 1024,
      originalname: 'attempted_override.php', // ຜູ້ໂຈມຕີພະຍາຍາມໃສ່ນາມສະກຸນ .php ມາໃນ originalname
    } as any;

    const savedUrl = await service.saveFile(validFile);

    expect(savedUrl).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    expect(savedUrl).not.toContain('.php');
    expect(fs.promises.writeFile).toHaveBeenCalled();
  });
});
