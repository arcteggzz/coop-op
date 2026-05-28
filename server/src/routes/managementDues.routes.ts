import { Router } from "express";
import * as controller from "../controllers/managementDues.controller";
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
 *   name: ManagementDues
 *   description: Manager portal dues management
 */

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/dashboard-summary:
 *   get:
 *     summary: Get the dues dashboard summary for the cooperative
 *     tags: [ManagementDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: memberId
 *         required: false
 *         schema:
 *           type: string
 *         description: Include per-member payment status for this member
 *     responses:
 *       200:
 *         description: Dues dashboard summary with state, aggregates, activeDues, and upcomingDues
 */
router.get(
  "/dashboard-summary",
  requireManagerPermission("ManagementDuesRead"),
  controller.getDashboardSummary,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/schedules:
 *   post:
 *     summary: Create a due schedule
 *     tags: [ManagementDues]
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
 */
router.post(
  "/schedules",
  requireManagerPermission("ManagementDuesWrite"),
  controller.createDueSchedule,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/schedules:
 *   get:
 *     summary: List all due schedules for the cooperative
 *     tags: [ManagementDues]
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
 *         description: Paginated list of due schedules
 */
router.get(
  "/schedules",
  requireManagerPermission("ManagementDuesRead"),
  controller.listDueSchedules,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/schedules/{scheduleId}:
 *   get:
 *     summary: Get a single due schedule
 *     tags: [ManagementDues]
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
 *         description: Due schedule
 *       404:
 *         description: Not found
 */
router.get(
  "/schedules/:scheduleId",
  requireManagerPermission("ManagementDuesRead"),
  controller.getDueSchedule,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/schedules/{scheduleId}:
 *   patch:
 *     summary: Update a due schedule
 *     tags: [ManagementDues]
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
 *     responses:
 *       200:
 *         description: Updated schedule
 */
router.patch(
  "/schedules/:scheduleId",
  requireManagerPermission("ManagementDuesWrite"),
  controller.updateDueSchedule,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/schedules/{scheduleId}:
 *   delete:
 *     summary: Soft-delete a due schedule
 *     tags: [ManagementDues]
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
 *         description: Schedule deleted
 */
router.delete(
  "/schedules/:scheduleId",
  requireManagerPermission("ManagementDuesWrite"),
  controller.deleteDueSchedule,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/schedules/{scheduleId}/issue:
 *   post:
 *     summary: Issue dues for a period
 *     tags: [ManagementDues]
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
  requireManagerPermission("ManagementDuesWrite"),
  controller.issueDues,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/payments:
 *   get:
 *     summary: List due payments for the cooperative
 *     tags: [ManagementDues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Paginated list of payments
 */
router.get(
  "/payments",
  requireManagerPermission("ManagementDuesRead"),
  controller.listDuePayments,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/payments/{paymentId}/record:
 *   patch:
 *     summary: Record a manual payment
 *     tags: [ManagementDues]
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
 */
router.patch(
  "/payments/:paymentId/record",
  requireManagerPermission("ManagementDuesWrite"),
  controller.recordPayment,
);

/**
 * @swagger
 * /api/management/dues/{cooperativeId}/payments/{paymentId}/waive:
 *   patch:
 *     summary: Waive a due payment
 *     tags: [ManagementDues]
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
 */
router.patch(
  "/payments/:paymentId/waive",
  requireManagerPermission("ManagementDuesWrite"),
  controller.waivePayment,
);

export default router;
