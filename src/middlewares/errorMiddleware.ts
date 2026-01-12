import { Request, Response, NextFunction } from 'express';

// 1. Catch-all for routes that don't exist (404)
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passing this error to the next middleware (which is errorHandler)
};

// 2. Global Error Handler (converts all errors to JSON)
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // If status code is 200 (default), change it to 500 (server error)
  // If it was already set (like 404 or 401), keep it.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode);

  res.json({
    message: err.message,
    // Only show stack trace in development mode (hide it in production for security)
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};