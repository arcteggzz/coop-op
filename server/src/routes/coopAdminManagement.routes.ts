import { Router } from "express";
import * as controller from "../controllers/coopAdminManagement.controller";
import {
  requireAdminAuth,
  requireAdminPermission,
  requireAdminRole,
} from "../middlewares/adminAuthMiddleware";

const router = Router();

// All routes in this file require a valid admin JWT
router.use(requireAdminAuth);

/**
 * @swagger
 * tags:
 *   name: CoopAdminManagement
 *   description: Back Office Admin user management
 */

/**
 * @swagger
 * /api/coop-admin/admins/invite:
 *   post:
 *     summary: Invite a new Back Office Admin
 *     tags: [CoopAdminManagement]
 *     security:
 *       - bearerAuth: []
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
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 example: jane@coop-op.com
 *               role:
 *                 type: string
 *                 enum: [SuperAdmin, Admin]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Required when role is Admin
 *     responses:
 *       201:
 *         description: Admin invited successfully
 *       409:
 *         description: Email already exists
 */
router.post(
  "/invite",
  requireAdminRole("RootAdmin", "SuperAdmin"),
  controller.inviteAdmin,
);

/**
 * @swagger
 * /api/coop-admin/admins:
 *   get:
 *     summary: List all Back Office Admins
 *     tags: [CoopAdminManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [RootAdmin, SuperAdmin, Admin]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *     responses:
 *       200:
 *         description: Paginated list of admins
 */
router.get("/", requireAdminPermission("CoopAdminRead"), controller.listAdmins);

/**
 * @swagger
 * /api/coop-admin/admins/{adminId}:
 *   get:
 *     summary: Get a single Admin by ID
 *     tags: [CoopAdminManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin details with permissions
 *       404:
 *         description: Admin not found
 */
router.get(
  "/:adminId",
  requireAdminPermission("CoopAdminRead"),
  controller.getAdmin,
);

/**
 * @swagger
 * /api/coop-admin/admins/{adminId}/permissions:
 *   patch:
 *     summary: Update permissions for an Admin role user
 *     tags: [CoopAdminManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
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
 *         description: Cannot modify SuperAdmin/RootAdmin permissions
 */
router.patch(
  "/:adminId/permissions",
  requireAdminRole("RootAdmin", "SuperAdmin"),
  controller.updatePermissions,
);

/**
 * @swagger
 * /api/coop-admin/admins/{adminId}/revoke:
 *   patch:
 *     summary: Revoke an Admin's access
 *     tags: [CoopAdminManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access revoked
 *       403:
 *         description: Insufficient permissions
 */
router.patch(
  "/:adminId/revoke",
  requireAdminPermission("CoopAdminWrite"),
  controller.revokeAdmin,
);

/**
 * @swagger
 * /api/coop-admin/admins/{adminId}/restore:
 *   patch:
 *     summary: Restore a previously revoked Admin
 *     tags: [CoopAdminManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access restored
 */
router.patch(
  "/:adminId/restore",
  requireAdminRole("RootAdmin", "SuperAdmin"),
  controller.restoreAdmin,
);

/**
 * @swagger
 * /api/coop-admin/admins/{adminId}:
 *   delete:
 *     summary: Soft-delete an Admin (RootAdmin only)
 *     tags: [CoopAdminManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin deleted
 *       403:
 *         description: Insufficient permissions
 */
router.delete(
  "/:adminId",
  requireAdminRole("RootAdmin"),
  controller.deleteAdmin,
);

export default router;
