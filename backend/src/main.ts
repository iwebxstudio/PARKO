// ============================================
// PARKO — Application Entry Point
// NestJS bootstrap with Swagger, CORS, Helmet
// ============================================
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS — explicit allowlist with credentials support
  const defaultCorsOrigins = [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:39741',
    'https://localhost:39742',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:39741',
    'https://127.0.0.1:39742',
  ];
  const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : defaultCorsOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isConfigured = configuredOrigins.includes(origin);
      const isLocalOrPrivateLan =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
          origin,
        );

      if (isConfigured || isLocalOrPrivateLan) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('PARKO SYSTEM API')
    .setDescription('PARKO SYSTEM API — Currency: LAK (Lao Kip)')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Parking', 'Check-in / Check-out')
    .addTag('Lost Tickets', 'Lost ticket management')
    .addTag('Pricing', 'Pricing rules')
    .addTag('Reports', 'Statistics & exports')
    .addTag('Audit', 'Audit logs')
    .addTag('Settings', 'System settings')
    .addTag('File Upload', 'Image upload')
    .addTag('Printer', 'Receipt printing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.BACKEND_PORT || 3000;
  await app.listen(port);
  logger.log(`🅿️  PARKO API running on http://localhost:${port}`);
  logger.log(`📄 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
