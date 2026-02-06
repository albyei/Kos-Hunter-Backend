import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  authentication,
  changeProfile,
  createUser,
  deleteUser,
  getAlluser,
  updateUser,
  getProfile,
  getUserbyId,
} from "../controllers/userC";
import {
  verifyAddUser,
  verifyAuthentification,
  verifyUpdateUser,
} from "../middlewares/verifyUser";
import uploadFileUser from "../middlewares/uploadUser";
import { verifyToken, verifyRole } from "../middlewares/authorization";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // reset jika login sukses
  keyGenerator: (req) => {
    const email = (req.body.email || "").toLowerCase().trim();
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "";
    return email ? `${email}:${ip}` : ip;
  },
  handler: (req, res) => {
    const email = req.body.email || "unknown";
    res.status(429).json({
      status: false,
      message: `Terlalu banyak percobaan login untuk ${email}. Coba lagi setelah 15 menit.`,
    });
  },
});

router.get(`/`, getAlluser);
router.post(
  `/create`,
  [uploadFileUser.single("picture"), verifyAddUser],
  createUser
);
router.put(
  `/:id`,
  [
    verifyToken,
    verifyRole(["OWNER"]),
    uploadFileUser.single("picture"),
    verifyUpdateUser,
  ],
  updateUser
);
router.post(`/login`, [loginLimiter, verifyAuthentification], authentication);
router.put(`/pic/:id`, [uploadFileUser.single("picture")], changeProfile);
router.delete(`/:id`, deleteUser);
router.get(`/profile/:id`, getUserbyId);
router.get(`/profile`, verifyToken, getProfile);

export default router;
