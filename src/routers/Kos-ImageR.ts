import { Router } from "express";
import {
  createKosImage,
  updateKosImage,
  deleteKosImage,
  getImageById,
  getAllImages,
} from "../controllers/kosImage";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import uploadKosImage from "../middlewares/uploadKosImage";
import { verifyCreateKosImage } from "../middlewares/verifiyKosImage";
import { getKosById } from "../controllers/kosC";

const router = Router();

router.post(
  "/image",
  [
    verifyToken,
    verifyRole(["OWNER"]),
    uploadKosImage.single("image"),
    verifyCreateKosImage,
  ],
  createKosImage
);

router.put(
  "/:id",
  [
    verifyToken,
    verifyRole(["OWNER"]),
    uploadKosImage.single("image"),
    verifyCreateKosImage,
  ],
  updateKosImage
);

router.delete("/:id", [verifyToken, verifyRole(["OWNER"])], deleteKosImage);
router.get("/", getAllImages);
router.get("/:id", getKosById);

export default router;
