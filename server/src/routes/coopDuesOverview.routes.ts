import { Router } from "express";
import * as controller from "../controllers/coopDues.controller";
import {
  requireAdminAuth,
  requireAdminPermission,
} from "../middlewares/adminAuthMiddleware";

const router = Router();

router.use(requireAdminAuth);

/**
 * @swagger
 * tags:
 *   name: CoopDuesOverview
 *   description: Back Office global dues overview (all cooperatives)
 */

/**
 * @swagger
 * /api/coop-admin/dues:
 *   get:
 *     summary: List all due schedules across all cooperatives
 *     tags: [CoopDuesOverview]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: cooperativeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of all due schedules with cooperative names
 */
router.get(
  "/",
  requireAdminPermission("CoopDuesRead"),
  controller.listAllDueSchedules,
);

export default router;
