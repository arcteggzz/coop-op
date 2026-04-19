import { Router } from "express";
import { simulateInflowHandler } from "../controllers/simulateInflow.controller";

const router = Router();

/**
 * @swagger
 * /api/simulate-inflow:
 *   post:
 *     summary: Simulate an Embedly wallet inflow (staging/development only)
 *     tags: [Simulate Inflow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - amount
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "9710024944"
 *               amount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Inflow simulated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not available in this environment
 */
router.post("/", simulateInflowHandler);

export default router;
