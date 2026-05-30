import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import axios from "axios";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { pool } from "./config/database";
import { getChannel } from "./utils/queue";
import { errorHandler } from "./middlewares/errorHandler";
import systemSetupTestRoutes from "./routes/systemSetupTest.routes";
import simulateInflowRoutes from "./routes/simulateInflow.routes";
import coopAdminAuthRoutes from "./routes/coopAdminAuth.routes";
import coopAdminManagementRoutes from "./routes/coopAdminManagement.routes";
import coopCooperativesRoutes from "./routes/coopCooperatives.routes";
import coopManagersRoutes from "./routes/coopManagers.routes";
import coopMembersRoutes from "./routes/coopMembers.routes";
import managementAuthRoutes from "./routes/managementAuth.routes";
import managementManagersRoutes from "./routes/managementManagers.routes";
import managementMembersRoutes from "./routes/managementMembers.routes";
import managerDashboardRoutes from "./routes/managerDashboard.routes";
import memberAuthRoutes from "./routes/memberAuth.routes";
import coopDuesRoutes from "./routes/coopDues.routes";
import coopDuesOverviewRoutes from "./routes/coopDuesOverview.routes";
import managementDuesRoutes from "./routes/managementDues.routes";
import memberDuesRoutes from "./routes/memberDues.routes";
import coopLeviesRoutes from "./routes/coopLevies.routes";
import coopLeviesOverviewRoutes from "./routes/coopLeviesOverview.routes";
import managementLeviesRoutes from "./routes/managementLevies.routes";
import memberLeviesRoutes from "./routes/memberLevies.routes";

const app = express();

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
      success: false,
      error: { code: "RATE_LIMIT", message: "Too many requests" },
    },
  }),
);

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        host: req.headers?.host,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Capture raw body buffer so the webhook controller can verify HMAC signatures
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// ─── Static files (for PDF downloads + bulk upload files) ────────────────────
app.use("/pdfs", express.static(path.resolve(__dirname, "../public/pdfs")));
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../public/uploads")),
);

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Coop API",
      version: "1.0.0",
      description: "Coop backend REST API documentation",
    },
    servers: [
      {
        url: env.appUrl,
        description: "Current server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    path.resolve(__dirname, "./routes/*.ts"),
    path.resolve(__dirname, "./routes/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/system-setup-test", systemSetupTestRoutes);
app.use("/api/simulate-inflow", simulateInflowRoutes);
app.use("/api/coop-admin", coopAdminAuthRoutes);
app.use("/api/coop-admin/admins", coopAdminManagementRoutes);
app.use("/api/coop-admin/cooperatives", coopCooperativesRoutes);
app.use(
  "/api/coop-admin/cooperatives/:cooperativeId/managers",
  coopManagersRoutes,
);
app.use(
  "/api/coop-admin/cooperatives/:cooperativeId/members",
  coopMembersRoutes,
);
app.use("/api/management", managementAuthRoutes);
app.use(
  "/api/management/cooperatives/:cooperativeId/managers",
  managementManagersRoutes,
);
app.use(
  "/api/management/cooperatives/:cooperativeId/members",
  managementMembersRoutes,
);
app.use("/api/management/cooperatives/:cooperativeId", managerDashboardRoutes);
app.use("/api/member", memberAuthRoutes);
// Dues routes — overview must be before the cooperativeId-scoped route
app.use("/api/coop-admin/dues", coopDuesOverviewRoutes);
app.use("/api/coop-admin/cooperatives/:cooperativeId/dues", coopDuesRoutes);
app.use("/api/management/dues/:cooperativeId", managementDuesRoutes);
app.use("/api/member/dues/:cooperativeId", memberDuesRoutes);
// Levies routes — overview must be before the cooperativeId-scoped route
app.use("/api/coop-admin/levies", coopLeviesOverviewRoutes);
app.use("/api/coop-admin/cooperatives/:cooperativeId/levies", coopLeviesRoutes);
app.use("/api/management/levies/:cooperativeId", managementLeviesRoutes);
app.use("/api/member/levies/:cooperativeId", memberLeviesRoutes);

// ─── Base Route ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: `Visit ${env.appUrl}/api-docs or ${env.appUrl}/health for health check information.`,
  });
});

// ─── Health checks ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

app.get("/health/db", async (_req, res) => {
  const start = Date.now();
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.status(200).json({
      success: true,
      data: { status: "Database is healthy.", durationMs: Date.now() - start },
    });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database connection failed",
      },
    });
  }
});

app.get("/health/queue", (_req, res) => {
  try {
    getChannel();
    res
      .status(200)
      .json({ success: true, data: { status: "Queue is healthy." } });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: "QUEUE_UNAVAILABLE",
        message: "RabbitMQ channel not initialized",
      },
    });
  }
});

app.get("/health/wallet-provider", async (_req, res) => {
  const start = Date.now();
  try {
    await axios.get(env.embedly.healthCheckUrl);
    res.status(200).json({
      success: true,
      data: {
        status: "Wallet provider is healthy.",
        durationMs: Date.now() - start,
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: "WALLET_PROVIDER_UNAVAILABLE",
        message: "Embedly health check failed",
      },
    });
  }
});

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

export default app;
