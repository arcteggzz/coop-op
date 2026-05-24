import { Router } from "express";
import * as controller from "../controllers/managementManagers.controller";
import {
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission,
  requireManagerRole,
} from "../middlewares/managerAuthMiddleware";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: ManagementManagers
 *   description: Manager portal — manage managers within a cooperative
 */

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/managers/invite:
 *   post:
 *     summary: Invite a Manager to the cooperative
 *     tags: [ManagementManagers]
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
 *               - fullName
 *               - email
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SuperManager, Support]
 *                 description: Managers can only invite SuperManager or Support — not RootManager
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Required when role is Support
 *     responses:
 *       201:
 *         description: Manager invited
 *       403:
 *         description: Not a manager of this cooperative or insufficient permissions
 *       409:
 *         description: Manager already in cooperative
 */
router.post(
  "/invite",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission("ManagementAdminWrite"),
  controller.inviteManager,
);

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/managers:
 *   get:
 *     summary: List all Managers of the cooperative
 *     tags: [ManagementManagers]
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
 *         description: Paginated list of managers
 *       403:
 *         description: Not a manager of this cooperative or insufficient permissions
 */
router.get(
  "/",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission("ManagementAdminRead"),
  controller.listManagers,
);

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/managers/{managerId}:
 *   get:
 *     summary: Get a single Manager's details
 *     tags: [ManagementManagers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manager details with permissions
 *       403:
 *         description: Not a manager of this cooperative or insufficient permissions
 *       404:
 *         description: Manager not found or not in cooperative
 */
router.get(
  "/:managerId",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission("ManagementAdminRead"),
  controller.getManager,
);

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/managers/{managerId}/permissions:
 *   patch:
 *     summary: Update permissions for a Support role manager (RootManager/SuperManager only)
 *     tags: [ManagementManagers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: managerId
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
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions updated
 *       400:
 *         description: Cannot set permissions for non-Support managers
 *       403:
 *         description: Requires RootManager or SuperManager role
 */
router.patch(
  "/:managerId/permissions",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerRole("RootManager", "SuperManager"),
  controller.updateManagerPermissions,
);

/**
 * @swagger
 * /api/management/cooperatives/{cooperativeId}/managers/{managerId}/revoke:
 *   patch:
 *     summary: Revoke a Manager's access to the cooperative (RootManager only)
 *     tags: [ManagementManagers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manager access revoked
 *       403:
 *         description: Requires RootManager role or cannot revoke a RootManager
 *       404:
 *         description: Manager not found or not in cooperative
 */
router.patch(
  "/:managerId/revoke",
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerRole("RootManager"),
  controller.revokeManager,
);

export default router;
