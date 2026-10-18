// ==============================================================================
// PARKO — ຕົວດັກຈັບ ແລະ ຈັດການຂໍ້ຜິດພາດລະບົບ (HTTP Exception Filter)
// ຈັດຮູບແບບຂໍ້ມູນ Error Response ໃຫ້ເປັນມາດຕະຖານດຽວກັນ ແລະ ເຊື່ອງລາຍລະອຽດລະບົບໃນ Production
// ==============================================================================
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    const isProduction = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        errors = resp.errors || null;
      }
    } else if (exception instanceof Error) {
      // ໃນສະພາບແວດລ້ອມ Production ຈະປິດບັງລາຍລະອຽດຂໍ້ຜິດພາດພາຍໃນ ແລະ ຖານຂໍ້ມູນ ເພື່ອຄວາມປອດໄພຂອງລະບົບ
      message = isProduction ? 'Internal server error' : exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unhandled unknown exception', String(exception));
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
