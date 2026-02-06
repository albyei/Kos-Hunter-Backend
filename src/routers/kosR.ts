import { Router } from "express";
import { RequestHandler } from "express";
import { createKos, getAllKos, getKosById, updateKos, deleteKos } from "../controllers/kosC";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import multer from "multer";
import fs from "fs";
import { verifyCreateKos, verifyUpdateKos } from "../middlewares/verifyKos";
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
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PNG, JPEG, JPG allowed."));
    }
  },
});

router.post(
  "/create",
  [verifyToken, verifyRole(["OWNER"]), upload.none(), verifyCreateKos],
  (createKos as unknown) as RequestHandler
);
router.get("/", (getAllKos as unknown) as RequestHandler);
router.get("/:id", (getKosById as unknown) as RequestHandler);
router.put(
  "/:id",
  [verifyToken, verifyRole(["OWNER"]), upload.none(), verifyUpdateKos],
  (updateKos as unknown) as RequestHandler
);

router.delete(
  "/:id",
  [verifyToken, verifyRole(["OWNER"])],
  (deleteKos as unknown) as RequestHandler
);

export default router;

