import { Router } from "express";
import * as controller from "../controllers/coopAdminAuth.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: CoopAdminAuth
 *   description: Back Office Admin authentication endpoints
 */

/**
 * @swagger
 * /api/coop-admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [CoopAdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@coop-op.com
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     requiresPasswordChange:
 *                       type: boolean
 *                     admin:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", controller.login);

/**
 * @swagger
 * /api/coop-admin/request-otp:
 *   post:
 *     summary: Request OTP for password change (step 1)
 *     tags: [CoopAdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@coop-op.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       404:
 *         description: Admin not found
 */
router.post("/request-otp", controller.requestOtp);

/**
 * @swagger
 * /api/coop-admin/verify-otp-and-change-password:
 *   post:
 *     summary: Verify OTP and set new password (step 2)
 *     tags: [CoopAdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@coop-op.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: MyNewPassword123
 *               confirmPassword:
 *                 type: string
 *                 example: MyNewPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid OTP, expired OTP, or password mismatch
 */
router.post(
  "/verify-otp-and-change-password",
  controller.verifyOtpAndChangePassword,
);

export default router;
