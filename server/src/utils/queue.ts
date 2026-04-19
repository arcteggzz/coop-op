import amqplib, { Channel } from "amqplib";
import { env } from "../config/env";
import { logger } from "./logger";

// amqplib.connect() returns a ChannelModel in newer versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;
let channel: Channel | null = null;

export async function connectQueue(): Promise<void> {
  connection = await amqplib.connect(env.rabbitmq.url);
  channel = await connection.createChannel();
  logger.info("RabbitMQ connection established");
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error(
      "RabbitMQ channel is not initialized. Call connectQueue() first.",
    );
  }
  return channel;
}

export async function publishToQueue(
  queueName: string,
  message: object,
): Promise<void> {
  const ch = getChannel();
  await ch.assertQueue(queueName, { durable: true });
  const messageBuffer = Buffer.from(JSON.stringify(message));
  ch.sendToQueue(queueName, messageBuffer, { persistent: true });
  logger.info({ queue: queueName, message }, "Message published to queue");
}

export async function consumeQueue(
  queueName: string,
  handler: (message: object) => Promise<void>,
  prefetch = 1,
): Promise<void> {
  const ch = getChannel();
  await ch.assertQueue(queueName, { durable: true });
  ch.prefetch(prefetch);

  logger.info({ queue: queueName }, "Waiting for messages from queue");

  ch.consume(queueName, async (msg) => {
    if (!msg) return;

    let parsed: object;
    try {
      parsed = JSON.parse(msg.content.toString());
      logger.info(
        { queue: queueName, message: parsed },
        "Message received from queue",
      );
      await handler(parsed);
      ch.ack(msg);
      logger.info(
        { queue: queueName },
        "Message acknowledged and removed from queue",
      );
    } catch (err) {
      logger.error(
        { queue: queueName, error: err },
        "Error processing queue message — rejecting",
      );
      ch.nack(msg, false, false); // discard, do not requeue
    }
  });
}
