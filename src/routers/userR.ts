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
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 percobaan login per IP
  message: {
    status: false,
    message: "Too many login attempts, please try again after 15 minutes",
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
