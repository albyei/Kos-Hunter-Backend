import { Router } from "express";
import { createKosFacility, deleteKosFacility, updateKosFacility } from "../controllers/kosFacilityC";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import uploadFormData from "../middlewares/uploadFormData";
import { verifyCreateKosFacility, verifyUpdateKosFacility } from "../middlewares/verifyKosFacility";

const router = Router();

router.post(
  "/facility",
  [verifyToken, verifyRole(["OWNER"]),uploadFormData, verifyCreateKosFacility],
  createKosFacility
);
router.put(
  "/:id",
  [verifyToken, verifyRole(["OWNER"]),uploadFormData, verifyUpdateKosFacility],
  updateKosFacility
);
router.delete(
  "/:id",
  [verifyToken, verifyRole(["OWNER"])],
  deleteKosFacility
);

export default router;
