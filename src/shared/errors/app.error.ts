export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (code !== undefined) {
      this.code = code;
    }

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code?: string): AppError {
    return new AppError(message, 400, true, code);
  }

  static unauthorized(
    message: string = "Unauthorized",
    code?: string
  ): AppError {
    return new AppError(message, 401, true, code);
  }

  static forbidden(message: string = "Forbidden", code?: string): AppError {
    return new AppError(message, 403, true, code);
  }

  static notFound(
    message: string = "Resource not found",
    code?: string
  ): AppError {
    return new AppError(message, 404, true, code);
  }

  static conflict(message: string, code?: string): AppError {
    return new AppError(message, 409, true, code);
  }

  static unprocessableEntity(message: string, code?: string): AppError {
    return new AppError(message, 422, true, code);
  }

  static internal(
    message: string = "Internal server error",
    code?: string
  ): AppError {
    return new AppError(message, 500, true, code);
  }

  static notImplemented(
    message: string = "Not implemented",
    code?: string
  ): AppError {
    return new AppError(message, 501, true, code);
  }
}
