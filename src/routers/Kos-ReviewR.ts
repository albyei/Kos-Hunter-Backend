import { Router } from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  replyReview,
} from "../controllers/kosReviewC";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import uploadFormData from "../middlewares/uploadFormData";
import {
  verifyCreateReview,
  verifyReplyReview,
  verifyUpdateReview,
} from "../middlewares/verifyKosReview";

const router = Router();

router.post(
  "/review",
  [verifyToken, verifyRole(["SOCIETY"]), uploadFormData, verifyCreateReview],
  createReview
);

router.put(
  "/:id",
  [verifyToken, verifyRole(["SOCIETY"]), uploadFormData, verifyUpdateReview],
  updateReview
);

router.delete("/:id", [verifyToken, verifyRole(["SOCIETY"])], deleteReview);

router.put(
  "/:id/reply",
  [verifyToken, verifyRole(["OWNER"]), uploadFormData, verifyReplyReview],
  replyReview
);

export default router;
