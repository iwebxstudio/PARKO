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
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    .setTitle('PARKO API')
    .setDescription('Parking Management System API — Currency: LAK (Lao Kip)')
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
