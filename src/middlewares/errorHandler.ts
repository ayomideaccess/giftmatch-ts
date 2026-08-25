import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
    });
    return;
  }

  console.error("ERROR:", err);
  res.status(500).json({
    message: "Something went wrong",
  });
};

export default errorHandler;