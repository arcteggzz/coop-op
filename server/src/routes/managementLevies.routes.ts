import { Router } from "express";
import * as controller from "../controllers/managementLevies.controller";
import {
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerPermission,
} from "../middlewares/managerAuthMiddleware";

// mergeParams inherits :cooperativeId from the parent path in app.ts
const router = Router({ mergeParams: true });

router.use(requireManagerAuth, requireManagerCooperativeAccess);

/**
 * @swagger
 * tags:
 *   name: ManagementLevies
 *   description: Manager portal levies management
 */

/**
 * @swagger
 * /api/management/levies/{cooperativeId}:
 *   post:
 *     summary: Create a levy
 *     tags: [ManagementLevies]
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
 *               - name
 *               - defaultAmount
 *               - levyAccountNumber
 *               - dueDate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               defaultAmount:
 *                 type: number
 *               levyAccountNumber:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Levy created
 */
router.post(
  "/",
  requireManagerPermission("ManagementLeviesWrite"),
  controller.createLevy,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}:
 *   get:
 *     summary: List all levies for the cooperative
 *     tags: [ManagementLevies]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of levies
 */
router.get(
  "/",
  requireManagerPermission("ManagementLeviesRead"),
  controller.listLevies,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}/{levyId}:
 *   get:
 *     summary: Get a single levy with assignment summary
 *     tags: [ManagementLevies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: levyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Levy detail with summary
 *       404:
 *         description: Levy not found
 */
router.get(
  "/:levyId",
  requireManagerPermission("ManagementLeviesRead"),
  controller.getLevyWithSummary,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}/{levyId}:
 *   patch:
 *     summary: Update a levy
 *     tags: [ManagementLevies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: levyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated levy
 */
router.patch(
  "/:levyId",
  requireManagerPermission("ManagementLeviesWrite"),
  controller.updateLevy,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}/{levyId}:
 *   delete:
 *     summary: Soft-delete a levy
 *     tags: [ManagementLevies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: levyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Levy deleted
 */
router.delete(
  "/:levyId",
  requireManagerPermission("ManagementLeviesWrite"),
  controller.softDeleteLevy,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}/{levyId}/assign:
 *   post:
 *     summary: Assign a levy to members
 *     tags: [ManagementLevies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: levyId
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
 *               - assignTo
 *             properties:
 *               assignTo:
 *                 type: string
 *                 enum: [all, specific]
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Assignments created
 */
router.post(
  "/:levyId/assign",
  requireManagerPermission("ManagementLeviesWrite"),
  controller.assignLevy,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}/{levyId}/assignments:
 *   get:
 *     summary: List all member assignments for a levy
 *     tags: [ManagementLevies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: levyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Waived]
 *     responses:
 *       200:
 *         description: Paginated list of levy assignments
 */
router.get(
  "/:levyId/assignments",
  requireManagerPermission("ManagementLeviesRead"),
  controller.listLevyAssignments,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}/assignments/{assignmentId}/record:
 *   patch:
 *     summary: Record a manual payment for a levy assignment
 *     tags: [ManagementLevies]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paidAmount
 *             properties:
 *               paidAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment recorded
 */
router.patch(
  "/assignments/:assignmentId/record",
  requireManagerPermission("ManagementLeviesWrite"),
  controller.recordLevyPayment,
);

/**
 * @swagger
 * /api/management/levies/{cooperativeId}/assignments/{assignmentId}/waive:
 *   patch:
 *     summary: Waive a levy assignment
 *     tags: [ManagementLevies]
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment waived
 */
router.patch(
  "/assignments/:assignmentId/waive",
  requireManagerPermission("ManagementLeviesWrite"),
  controller.waiveLevyAssignment,
);

export default router;
