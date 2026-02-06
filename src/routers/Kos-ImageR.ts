import { Router } from "express";
import { RequestHandler } from "express";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import multer from "multer";
import fs from "fs";
import {
  getAllImages,
  getImageById,
  createKosImage,
  updateKosImage,
  deleteKosImage,
} from "../controllers/kosImage";
import { AuthenticatedRequest } from "../types/express"; // Impor dari types.ts

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/kos_images/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Batas ukuran file 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PNG, JPEG, JPG allowed."));
    }
  },
});

router.get("/images", getAllImages as unknown as RequestHandler);
router.get("/images/:id", getImageById as unknown as RequestHandler);
router.post(
  "/images",
  [verifyToken, verifyRole(["OWNER"]), upload.array("images", 10)],
  createKosImage as unknown as RequestHandler
);
router.put(
  "/images/:id",
  [verifyToken, verifyRole(["OWNER"]), upload.single("image")], // Pastikan ini benar
  updateKosImage as unknown as RequestHandler
);
router.delete(
  "/images/:id",
  [verifyToken, verifyRole(["OWNER"])],
  deleteKosImage as unknown as RequestHandler
);

export default router;
