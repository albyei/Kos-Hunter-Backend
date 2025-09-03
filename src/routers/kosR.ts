import { Router } from "express";
import { createKos, getAllKos, getKosById, updateKos } from "../controllers/kosC";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import uploadFormData from "../middlewares/uploadFormData";
import { verifyCreateKos, verifyUpdateKos } from "../middlewares/verifyKos";

const router = Router();

router.post(
  "/create",
  [verifyToken, verifyRole(["OWNER"]), uploadFormData, verifyCreateKos],
  createKos
);

router.get("/", getAllKos);
router.get("/:id", getKosById);
router.put(
  "/:id",
  [verifyToken, verifyRole(["OWNER"]), uploadFormData, verifyUpdateKos],
  updateKos 
);

export default router;
