/**
 * API Response utility for standardized responses
 */

import { Response } from 'express';

export class ApiResponse {
  /**
   * Send a success response
   */
  static success(res: Response, data: any, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send an error response
   */
  static error(res: Response, message: string, statusCode: number = 500): Response {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send a validation error response
   */
  static validationError(res: Response, errors: any[]): Response {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors,
        statusCode: 400
      },
      timestamp: new Date().toISOString()
    });
  }
}
