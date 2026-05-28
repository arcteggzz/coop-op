import { Router } from "express";
import * as controller from "../controllers/coopDues.controller";
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
 *   name: CoopDues
 *   description: Back Office cooperative dues management
 */

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/schedules:
 *   post:
 *     summary: Create a due schedule for a cooperative
 *     tags: [CoopDues]
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
 *               - amount
 *               - frequency
 *               - startDate
 *               - dueAccountNumber
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               frequency:
 *                 type: string
 *                 enum: [Monthly, Quarterly, Biannual, Annual, OneTime]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               dueAccountNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Due schedule created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Cooperative or treasury wallet not found
 */
router.post(
  "/schedules",
  requireAdminPermission("CoopDuesWrite"),
  controller.createDueSchedule,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/schedules:
 *   get:
 *     summary: List all due schedules for a cooperative
 *     tags: [CoopDues]
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
 *         description: Paginated list of due schedules
 */
router.get(
  "/schedules",
  requireAdminPermission("CoopDuesRead"),
  controller.listDueSchedules,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/schedules/{scheduleId}:
 *   get:
 *     summary: Get a single due schedule
 *     tags: [CoopDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Due schedule detail
 *       404:
 *         description: Due schedule not found
 */
router.get(
  "/schedules/:scheduleId",
  requireAdminPermission("CoopDuesRead"),
  controller.getDueSchedule,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/schedules/{scheduleId}:
 *   patch:
 *     summary: Update a due schedule
 *     tags: [CoopDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
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
 *               amount:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated due schedule
 *       404:
 *         description: Due schedule not found
 */
router.patch(
  "/schedules/:scheduleId",
  requireAdminPermission("CoopDuesWrite"),
  controller.updateDueSchedule,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/schedules/{scheduleId}:
 *   delete:
 *     summary: Soft-delete a due schedule
 *     tags: [CoopDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Due schedule deleted
 *       404:
 *         description: Due schedule not found
 */
router.delete(
  "/schedules/:scheduleId",
  requireAdminPermission("CoopDuesWrite"),
  controller.deleteDueSchedule,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/schedules/{scheduleId}/issue:
 *   post:
 *     summary: Issue dues for a period — creates a payment record for every active member
 *     tags: [CoopDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
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
 *               - periodLabel
 *               - dueDate
 *             properties:
 *               periodLabel:
 *                 type: string
 *                 example: "June 2026"
 *               dueDate:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Dues issued
 *       409:
 *         description: Period already issued
 */
router.post(
  "/schedules/:scheduleId/issue",
  requireAdminPermission("CoopDuesWrite"),
  controller.issueDues,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/payments:
 *   get:
 *     summary: List due payments for a cooperative (filterable)
 *     tags: [CoopDues]
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
 *         name: memberId
 *         schema:
 *           type: string
 *       - in: query
 *         name: periodLabel
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Waived, Overdue]
 *     responses:
 *       200:
 *         description: Paginated list of due payments
 */
router.get(
  "/payments",
  requireAdminPermission("CoopDuesRead"),
  controller.listDuePayments,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/payments/{paymentId}/record:
 *   patch:
 *     summary: Record a manual payment for a member's due
 *     tags: [CoopDues]
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
 *         description: Due payment not found
 *       409:
 *         description: Already paid
 */
router.patch(
  "/payments/:paymentId/record",
  requireAdminPermission("CoopDuesWrite"),
  controller.recordPayment,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/dues/payments/{paymentId}/waive:
 *   patch:
 *     summary: Waive a member's due payment
 *     tags: [CoopDues]
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
 *         description: Payment waived
 *       404:
 *         description: Due payment not found
 *       409:
 *         description: Already paid
 */
router.patch(
  "/payments/:paymentId/waive",
  requireAdminPermission("CoopDuesWrite"),
  controller.waivePayment,
);

export default router;
