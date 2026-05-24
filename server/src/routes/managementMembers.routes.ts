import { Router } from "express";
import * as controller from "../controllers/managementMembers.controller";
import {
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission,
} from "../middlewares/managerAuthMiddleware";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: ManagementMembers
 *   description: Manager portal — manage members within a cooperative
 */

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/members/invite:
 *   post:
 *     summary: Invite a Member to the cooperative
 *     tags: [ManagementMembers]
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
 *       403:
 *         description: Not a manager of this cooperative or insufficient permissions
 *       409:
 *         description: Member already in cooperative
 */
router.post(
  "/invite",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission("ManagementMembersWrite"),
  controller.inviteMember,
);

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/members:
 *   get:
 *     summary: List all Members of the cooperative
 *     tags: [ManagementMembers]
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
 *       403:
 *         description: Not a manager of this cooperative or insufficient permissions
 */
router.get(
  "/",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission("ManagementMembersRead"),
  controller.listMembers,
);

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/members/{memberId}:
 *   get:
 *     summary: Get a single Member's details
 *     tags: [ManagementMembers]
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
 *       403:
 *         description: Not a manager of this cooperative or insufficient permissions
 *       404:
 *         description: Member not found or not in cooperative
 */
router.get(
  "/:memberId",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission("ManagementMembersRead"),
  controller.getMember,
);

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/members/{memberId}/revoke:
 *   patch:
 *     summary: Revoke a Member's access to the cooperative
 *     tags: [ManagementMembers]
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
 *         description: Member access revoked
 *       403:
 *         description: Not a manager of this cooperative or insufficient permissions
 *       404:
 *         description: Member not found or not in cooperative
 */
router.patch(
  "/:memberId/revoke",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission("ManagementMembersWrite"),
  controller.revokeMember,
);

export default router;
