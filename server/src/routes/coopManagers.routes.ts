import { Router } from "express";
import * as controller from "../controllers/coopManagers.controller";
import {
  requireAdminAuth,
  requireAdminPermission,
  requireAdminRole,
} from "../middlewares/adminAuthMiddleware";

// mergeParams inherits :cooperativeId from the parent path in app.ts
const router = Router({ mergeParams: true });

router.use(requireAdminAuth);

/**
 * @swagger
 * tags:
 *   name: CoopManagers
 *   description: Back Office cooperative manager management
 */

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/managers/invite:
 *   post:
 *     summary: Invite a Manager to a Cooperative
 *     tags: [CoopManagers]
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
 *                 enum: [RootManager, SuperManager, Support]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Required when role is Support
 *     responses:
 *       201:
 *         description: Manager invited
 *       409:
 *         description: Manager already in cooperative or RootManager already exists
 */
router.post(
  "/invite",
  requireAdminPermission("CoopManagersWrite"),
  controller.inviteManager,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/managers:
 *   get:
 *     summary: List all Managers of a Cooperative
 *     tags: [CoopManagers]
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
 */
router.get(
  "/",
  requireAdminPermission("CoopManagersRead"),
  controller.listManagers,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/managers/{managerId}:
 *   get:
 *     summary: Get a single Manager's details
 *     tags: [CoopManagers]
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
 *       404:
 *         description: Manager not found or not in cooperative
 */
router.get(
  "/:managerId",
  requireAdminPermission("CoopManagersRead"),
  controller.getManager,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/managers/{managerId}/permissions:
 *   patch:
 *     summary: Update Support manager permissions
 *     tags: [CoopManagers]
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
 */
router.patch(
  "/:managerId/permissions",
  requireAdminRole("RootAdmin", "SuperAdmin"),
  controller.updateManagerPermissions,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/managers/{managerId}/revoke:
 *   patch:
 *     summary: Revoke a Manager's access to the cooperative
 *     tags: [CoopManagers]
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
 *         description: Access revoked
 *       403:
 *         description: Cannot revoke RootManager
 */
router.patch(
  "/:managerId/revoke",
  requireAdminPermission("CoopManagersWrite"),
  controller.revokeManager,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/managers/{managerId}/transfer-root:
 *   patch:
 *     summary: Transfer RootManager role to another manager (RootAdmin/SuperAdmin only)
 *     tags: [CoopManagers]
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
 *         description: RootManager role transferred
 *       404:
 *         description: Manager not found or not in cooperative
 */
router.patch(
  "/:managerId/transfer-root",
  requireAdminRole("RootAdmin", "SuperAdmin"),
  controller.transferRoot,
);

export default router;
