import { Router } from "express";
import { createReview, updateReview, deleteReview } from "../controllers/kosReviewC";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import uploadFormData from "../middlewares/uploadFormData";
import { verifyCreateReview, verifyUpdateReview } from "../middlewares/verifyKosReview";

const router = Router();


router.post(
  "/review",
  [verifyToken, verifyRole(["SOCIETY"]),uploadFormData, verifyCreateReview],
  createReview
);

router.put(
  "/:id",
  [verifyToken, verifyRole(["SOCIETY"]),uploadFormData, verifyUpdateReview],
  updateReview
);
 router.delete(
  "/:id",
  [verifyToken, verifyRole(["SOCIETY"])],
  deleteReview
);

export default router;