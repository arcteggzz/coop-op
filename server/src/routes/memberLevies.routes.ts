import { Router } from "express";
import * as controller from "../controllers/memberLevies.controller";
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
 *   name: MemberLevies
 *   description: Member portal levies
 */

/**
 * @swagger
 * /api/member/levies/{cooperativeId}:
 *   get:
 *     summary: List all levy assignments for the calling member
 *     tags: [MemberLevies]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Waived]
 *     responses:
 *       200:
 *         description: Paginated list of levy assignments
 */
router.get("/", controller.listMemberAssignments);

/**
 * @swagger
 * /api/member/levies/{cooperativeId}/{assignmentId}:
 *   get:
 *     summary: Get a single levy assignment
 *     tags: [MemberLevies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Levy assignment detail
 *       404:
 *         description: Assignment not found
 */
router.get("/:assignmentId", controller.getMemberAssignment);

/**
 * @swagger
 * /api/member/levies/{cooperativeId}/{assignmentId}/pay:
 *   post:
 *     summary: Pay a levy from the member's wallet
 *     tags: [MemberLevies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Insufficient wallet balance
 *       404:
 *         description: Assignment not found
 *       409:
 *         description: Already paid or waived
 */
router.post("/:assignmentId/pay", controller.payLevyFromWallet);

export default router;
