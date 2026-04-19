import app from "./app";
import { env, validateEnv } from "./config/env";
import { logger } from "./utils/logger";
import { testDatabaseConnection } from "./config/database";
import { connectQueue } from "./utils/queue";
import { startQueueWorkers } from "./utils/queueWorker";

async function bootstrap(): Promise<void> {
  validateEnv();
  logger.info("Environment validated successfully");

  // Verify DB connection before starting
  await testDatabaseConnection();

  // Connect to RabbitMQ and start workers
  await connectQueue();
  await startQueueWorkers();

  // Start HTTP server
  app.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, "Coop server started");
    logger.info(`Swagger docs available at ${env.appUrl}/api-docs`);
    logger.info(`Health check available at ${env.appUrl}/health`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
