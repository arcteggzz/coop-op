import { Router } from "express";
import * as controller from "../controllers/memberDues.controller";
import {
  requireMemberAuth,
  requireMemberCooperativeAccess,
} from "../middlewares/memberAuthMiddleware";

// mergeParams inherits :cooperativeId from the parent path in app.ts
const router = Router({ mergeParams: true });

router.use(requireMemberAuth, requireMemberCooperativeAccess);

/**
 * @swagger
 * tags:
 *   name: MemberDues
 *   description: Member portal dues
 */

/**
 * @swagger
 * /api/member/dues/{cooperativeId}/dashboard-summary:
 *   get:
 *     summary: Get the dues dashboard summary for the calling member
 *     tags: [MemberDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dues dashboard summary including memberStatus per active due
 */
router.get("/dashboard-summary", controller.getDashboardSummary);

/**
 * @swagger
 * /api/member/dues/{cooperativeId}/schedules:
 *   get:
 *     summary: List active due schedules for the cooperative
 *     tags: [MemberDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active due schedules
 */
router.get("/schedules", controller.listDueSchedules);

/**
 * @swagger
 * /api/member/dues/{cooperativeId}/payments/outstanding:
 *   get:
 *     summary: List all Pending and Overdue due payments for the calling member
 *     tags: [MemberDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outstanding payments with totalOutstanding sum
 */
router.get("/payments/outstanding", controller.listOutstandingPayments);

/**
 * @swagger
 * /api/member/dues/{cooperativeId}/payments:
 *   get:
 *     summary: List the calling member's due payment records
 *     tags: [MemberDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: scheduleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of due payments
 */
router.get("/payments", controller.listDuePayments);

/**
 * @swagger
 * /api/member/dues/{cooperativeId}/payments/{paymentId}/pay:
 *   post:
 *     summary: Pay a due from the member's wallet
 *     tags: [MemberDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Insufficient wallet balance
 *       404:
 *         description: Due payment not found
 *       409:
 *         description: Already paid or waived
 */
router.post("/payments/:paymentId/pay", controller.payFromWallet);

export default router;
