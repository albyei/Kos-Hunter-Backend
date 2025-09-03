import { Router } from "express";
import {
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingById,
  getBookingsByOwner,
} from "../controllers/kosBookingC";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import uploadFormData from "../middlewares/uploadFormData";
import {
  verifyCreateBooking,
  verifyUpdateBooking,
  verifyDeleteBooking,
  verifyGetBookingById,
  verifyGetBookingHistory,
} from "../middlewares/verifyKosBooking";

const router = Router();

router.post(
  "/",
  [verifyToken, verifyRole(["SOCIETY"]), uploadFormData, verifyCreateBooking],
  createBooking
);

router.put(
  "/:id",
  [
    verifyToken,
    verifyRole(["SOCIETY", "OWNER"]),
    uploadFormData,
    verifyUpdateBooking,
  ],
  updateBooking
);

router.delete(
  "/:id",
  [verifyToken, verifyRole(["SOCIETY", "OWNER"]), verifyDeleteBooking],
  deleteBooking
);

router.get(
  "/:id",
  [verifyToken, verifyRole(["SOCIETY"]), verifyGetBookingById],
  getBookingById
);

router.get(
  "/",
  [verifyToken, verifyRole(["OWNER"]), verifyGetBookingHistory],
  getBookingsByOwner
);

export default router;
