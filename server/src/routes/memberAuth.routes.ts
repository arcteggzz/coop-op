import { Router } from "express";
import * as controller from "../controllers/memberAuth.controller";
import * as walletController from "../controllers/memberWallet.controller";
import {
  requireMemberAuth,
  requireMemberCooperativeAccess,
} from "../middlewares/memberAuthMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: MemberAuth
 *   description: Member portal authentication endpoints
 */

/**
 * @swagger
 * /api/member/login:
 *   post:
 *     summary: Member login
 *     tags: [MemberAuth]
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
 *                 example: member@cooperative.com
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
 *                     member:
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
 *                           isDefault:
 *                             type: boolean
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", controller.login);

/**
 * @swagger
 * /api/member/request-otp:
 *   post:
 *     summary: Request OTP for password change (step 1)
 *     tags: [MemberAuth]
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
 *                 example: member@cooperative.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       404:
 *         description: Member not found
 */
router.post("/request-otp", controller.requestOtp);

/**
 * @swagger
 * /api/member/verify-otp-and-change-password:
 *   post:
 *     summary: Verify OTP and set new password (step 2)
 *     tags: [MemberAuth]
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
 *                 example: member@cooperative.com
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

/**
 * @swagger
 * /api/member/dashboard:
 *   get:
 *     summary: Get member dashboard for a specific cooperative
 *     tags: [MemberAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The cooperative to load the dashboard for
 *     responses:
 *       200:
 *         description: Dashboard data
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
 *                     member:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                     activeCooperative:
 *                       type: object
 *                       properties:
 *                         cooperativeId:
 *                           type: string
 *                         cooperativeName:
 *                           type: string
 *                     cooperatives:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cooperativeId:
 *                             type: string
 *                           cooperativeName:
 *                             type: string
 *                           isDefault:
 *                             type: boolean
 *       403:
 *         description: Not a member of this cooperative
 */
router.get(
  "/dashboard",
  requireMemberAuth,
  requireMemberCooperativeAccess,
  controller.getDashboard,
);

router.get(
  "/wallet",
  requireMemberAuth,
  requireMemberCooperativeAccess,
  walletController.getWalletDetails,
);

router.get(
  "/wallet/balance",
  requireMemberAuth,
  requireMemberCooperativeAccess,
  walletController.getWalletBalance,
);

router.get(
  "/wallet/transactions",
  requireMemberAuth,
  requireMemberCooperativeAccess,
  walletController.getWalletTransactions,
);

router.post(
  "/wallet/statement",
  requireMemberAuth,
  walletController.exportStatement,
);

export default router;
