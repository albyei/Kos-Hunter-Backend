import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      name: string;
      email: string;
      role: string;
      iat?: number;
      exp?: number;
    };
  }
}
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
  files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
}