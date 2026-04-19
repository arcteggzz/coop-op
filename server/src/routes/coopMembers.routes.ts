import { Router } from "express";
import * as controller from "../controllers/coopMembers.controller";
import {
  requireAdminAuth,
  requireAdminPermission,
} from "../middlewares/adminAuthMiddleware";

// mergeParams inherits :cooperativeId from the parent path in app.ts
const router = Router({ mergeParams: true });

router.use(requireAdminAuth);

/**
 * @swagger
 * tags:
 *   name: CoopMembers
 *   description: Back Office cooperative member management
 */

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/members/invite:
 *   post:
 *     summary: Invite a Member to a Cooperative
 *     tags: [CoopMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member invited and wallet creation queued
 *       409:
 *         description: Member already in cooperative
 */
router.post(
  "/invite",
  requireAdminPermission("CoopMembersWrite"),
  controller.inviteMember,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/members:
 *   get:
 *     summary: List all Members of a Cooperative
 *     tags: [CoopMembers]
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
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of members
 */
router.get(
  "/",
  requireAdminPermission("CoopMembersRead"),
  controller.listMembers,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/members/{memberId}:
 *   get:
 *     summary: Get a single Member's details
 *     tags: [CoopMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member details
 *       404:
 *         description: Member not found or not in cooperative
 */
router.get(
  "/:memberId",
  requireAdminPermission("CoopMembersRead"),
  controller.getMember,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/members/{memberId}/revoke:
 *   patch:
 *     summary: Revoke a Member's access to the cooperative
 *     tags: [CoopMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access revoked
 *       404:
 *         description: Member not found or not in cooperative
 */
router.patch(
  "/:memberId/revoke",
  requireAdminPermission("CoopMembersWrite"),
  controller.revokeMember,
);

export default router;
