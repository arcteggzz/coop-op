import { Router } from "express";
import * as controller from "../controllers/coopCooperatives.controller";
import {
  requireAdminAuth,
  requireAdminPermission,
  requireAdminRole,
} from "../middlewares/adminAuthMiddleware";

const router = Router();

router.use(requireAdminAuth);

/**
 * @swagger
 * tags:
 *   name: CoopCooperatives
 *   description: Back Office cooperative management
 */

/**
 * @swagger
 * /api/coop-admin/cooperatives:
 *   post:
 *     summary: Create a new Cooperative
 *     tags: [CoopCooperatives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lagos Teachers Cooperative
 *     responses:
 *       201:
 *         description: Cooperative created
 *       409:
 *         description: Name already exists
 */
router.post(
  "/",
  requireAdminRole("RootAdmin", "SuperAdmin"),
  controller.createCooperative,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives:
 *   get:
 *     summary: List all Cooperatives
 *     tags: [CoopCooperatives]
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
 *         name: name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of cooperatives
 */
router.get(
  "/",
  requireAdminPermission("CoopCooperativesRead"),
  controller.listCooperatives,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}:
 *   get:
 *     summary: Get a single Cooperative by ID
 *     tags: [CoopCooperatives]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cooperative details with properties
 *       404:
 *         description: Cooperative not found
 */
router.get(
  "/:cooperativeId",
  requireAdminPermission("CoopCooperativesRead"),
  controller.getCooperative,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}:
 *   patch:
 *     summary: Update Cooperative name
 *     tags: [CoopCooperatives]
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
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cooperative updated
 *       404:
 *         description: Cooperative not found
 */
router.patch(
  "/:cooperativeId",
  requireAdminPermission("CoopCooperativesWrite"),
  controller.updateCooperative,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}:
 *   delete:
 *     summary: Soft-delete a Cooperative (RootAdmin/SuperAdmin only)
 *     tags: [CoopCooperatives]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cooperative deleted
 *       404:
 *         description: Cooperative not found
 */
router.delete(
  "/:cooperativeId",
  requireAdminRole("RootAdmin", "SuperAdmin"),
  controller.deleteCooperative,
);

/**
 * @swagger
 * /api/coop-admin/cooperatives/{cooperativeId}/create-wallet:
 *   post:
 *     summary: Create a wallet for a Cooperative
 *     tags: [CoopCooperatives]
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
 *               - walletName
 *             properties:
 *               walletName:
 *                 type: string
 *                 example: Main Wallet
 *     responses:
 *       202:
 *         description: Wallet creation queued successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Cooperative not found
 */
router.post(
  "/:cooperativeId/create-wallet",
  requireAdminPermission("CoopCooperativesWrite"),
  controller.createCooperativeWallet,
);

router.get(
  "/:cooperativeId/summary",
  requireAdminPermission("CoopCooperativesRead"),
  controller.getCooperativeSummary,
);

router.get(
  "/:cooperativeId/wallets",
  requireAdminPermission("CoopCooperativesRead"),
  controller.getCooperativeWallets,
);

router.get(
  "/:cooperativeId/wallets/balance",
  requireAdminPermission("CoopCooperativesRead"),
  controller.getCooperativeWalletBalance,
);

export default router;
