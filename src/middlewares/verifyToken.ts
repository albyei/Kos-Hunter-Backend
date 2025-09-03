import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { JWT_SECRET } from "../global";

interface AuthenticatedRequest extends Request {
  user?: { id: number; name: string; email: string; phone: string; role: string };
}

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; name: string; email: string; phone: string; role: string };
    req.user = decoded;
    logger.info(`Token verified for user: ${decoded.email}, id: ${decoded.id}`);
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Token verification failed: ${message}`);
    return res.status(401).json({ status: false, message: `Token verification failed: ${message}` });
  }
};