import { Router } from "express";
import * as controller from "../controllers/coopLevies.controller";
import {
  requireAdminAuth,
  requireAdminPermission,
} from "../middlewares/adminAuthMiddleware";

const router = Router();

router.use(requireAdminAuth);

/**
 * @swagger
 * tags:
 *   name: CoopLeviesOverview
 *   description: Back Office global levies overview (all cooperatives)
 */

/**
 * @swagger
 * /api/coop-admin/levies:
 *   get:
 *     summary: List all levies across all cooperatives
 *     tags: [CoopLeviesOverview]
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
 *         description: Paginated list of all levies with cooperative names
 */
router.get(
  "/",
  requireAdminPermission("CoopLeviesRead"),
  controller.listAllLevies,
);

export default router;
