import { Router } from "express";
import * as controller from "../controllers/coopLevies.controller";
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
 *   name: CoopLevies
 *   description: Back Office cooperative levies management
 */

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies:
 *   post:
 *     summary: Create a levy for a cooperative
 *     tags: [CoopLevies]
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
 *       400:
 *         description: Validation error
 *       404:
 *         description: Cooperative or treasury wallet not found
 */
router.post(
  "/",
  requireAdminPermission("CoopLeviesWrite"),
  controller.createLevy,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies:
 *   get:
 *     summary: List all levies for a cooperative
 *     tags: [CoopLevies]
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
  requireAdminPermission("CoopLeviesRead"),
  controller.listLevies,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies/{levyId}:
 *   get:
 *     summary: Get a single levy with assignment summary
 *     tags: [CoopLevies]
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
 *         description: Levy detail with summary counts
 *       404:
 *         description: Levy not found
 */
router.get(
  "/:levyId",
  requireAdminPermission("CoopLeviesRead"),
  controller.getLevyWithSummary,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies/{levyId}:
 *   patch:
 *     summary: Update a levy
 *     tags: [CoopLevies]
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
 *             properties:
 *               name:
 *                 type: string
 *               defaultAmount:
 *                 type: number
 *               levyAccountNumber:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated levy
 *       404:
 *         description: Levy not found
 */
router.patch(
  "/:levyId",
  requireAdminPermission("CoopLeviesWrite"),
  controller.updateLevy,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies/{levyId}:
 *   delete:
 *     summary: Soft-delete a levy
 *     tags: [CoopLevies]
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
 *       404:
 *         description: Levy not found
 */
router.delete(
  "/:levyId",
  requireAdminPermission("CoopLeviesWrite"),
  controller.softDeleteLevy,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies/{levyId}/assign:
 *   post:
 *     summary: Assign a levy to members (all or specific)
 *     tags: [CoopLevies]
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
 *               amountOverrides:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     memberId:
 *                       type: string
 *                     amount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Assignments created — returns assigned and skipped counts
 *       404:
 *         description: Levy not found
 */
router.post(
  "/:levyId/assign",
  requireAdminPermission("CoopLeviesWrite"),
  controller.assignLevy,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies/{levyId}/assignments:
 *   get:
 *     summary: List all member assignments for a levy
 *     tags: [CoopLevies]
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
 *       404:
 *         description: Levy not found
 */
router.get(
  "/:levyId/assignments",
  requireAdminPermission("CoopLeviesRead"),
  controller.listLevyAssignments,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies/assignments/{assignmentId}/record:
 *   patch:
 *     summary: Record a manual payment for a levy assignment
 *     tags: [CoopLevies]
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
 *       404:
 *         description: Assignment not found
 *       409:
 *         description: Already paid
 */
router.patch(
  "/assignments/:assignmentId/record",
  requireAdminPermission("CoopLeviesWrite"),
  controller.recordLevyPayment,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/levies/assignments/{assignmentId}/waive:
 *   patch:
 *     summary: Waive a levy assignment
 *     tags: [CoopLevies]
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
 *       404:
 *         description: Assignment not found
 *       409:
 *         description: Already paid
 */
router.patch(
  "/assignments/:assignmentId/waive",
  requireAdminPermission("CoopLeviesWrite"),
  controller.waiveLevyAssignment,
);

export default router;
