import { Router } from "express";
import * as controller from "../controllers/managementAuth.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ManagementAuth
 *   description: Manager portal authentication endpoints
 */

/**
 * @swagger
 * /api/management/login:
 *   post:
 *     summary: Manager login
 *     tags: [ManagementAuth]
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
 *                 example: manager@cooperative.com
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
 *                     manager:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         defaultPasswordChanged:
 *                           type: boolean
 *                         dateInvited:
 *                           type: string
 *                           format: date-time
 *                     cooperatives:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cooperativeId:
 *                             type: string
 *                           cooperativeName:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [RootManager, SuperManager, Support]
 *                           isDefault:
 *                             type: boolean
 *                           permissions:
 *                             type: array
 *                             items:
 *                               type: string
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", controller.login);

/**
 * @swagger
 * /api/management/request-otp:
 *   post:
 *     summary: Request OTP for password change (step 1)
 *     tags: [ManagementAuth]
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
 *                 example: manager@cooperative.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       404:
 *         description: Manager not found
 */
router.post("/request-otp", controller.requestOtp);

/**
 * @swagger
 * /api/management/verify-otp-and-change-password:
 *   post:
 *     summary: Verify OTP and set new password (step 2)
 *     tags: [ManagementAuth]
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
 *                 example: manager@cooperative.com
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
