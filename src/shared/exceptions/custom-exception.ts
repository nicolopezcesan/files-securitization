import { HttpException, HttpStatus } from "@nestjs/common";

export class CustomException extends HttpException {
  constructor({ code, message, error, status }: { code: string, message: string, error?: any, status: number }) {
    super({
      code,
      success: false,
      message: message || error.message,
    },
      status || HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}