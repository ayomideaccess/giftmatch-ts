import { type Request, type Response, type NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const db = prisma as any;

    if (!accessToken) {
      res.status(401).json({
        message: 'Not authorized, no token',
      });
      return;
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload & { id: number };

    const admin = await db.admin.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!admin) {
      res.status(401).json({
        message: 'Not authorized, user not found',
      });
      return;
    }

    req.admin = admin;

    next();
  } catch (error) {
    res.status(401).json({
      message: 'Not authorized, invalid token',
    });
  }
};