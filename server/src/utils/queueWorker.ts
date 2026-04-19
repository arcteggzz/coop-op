import { consumeQueue } from "./queue";
import { markNoteCompleted } from "../services/systemSetupTest.service";
import { logger } from "./logger";
import { processCreateMemberWallet } from "../services/memberWallet.service";
import { processCreateCooperativeWallet } from "../services/cooperativeWallet.service";

const NOTE_COMPLETION_QUEUE = "note-completion";
const CREATE_MEMBER_WALLET_QUEUE = "create-member-wallet";
const CREATE_COOPERATIVE_WALLET_QUEUE = "create-cooperative-wallet";

export async function startQueueWorkers(): Promise<void> {
  // ── Test worker ───────────────────────────────────────────────────────────
  await consumeQueue(NOTE_COMPLETION_QUEUE, async (message: object) => {
    const { noteId } = message as { noteId: number };
    logger.info(
      { noteId },
      "Worker: received note-completion message, marking note as completed",
    );
    await markNoteCompleted(noteId);
    logger.info({ noteId }, "Worker: note marked as completed successfully");
  });

  // ── Member wallet creation worker (prefetch 3 to handle bulk uploads) ───────
  await consumeQueue(
    CREATE_MEMBER_WALLET_QUEUE,
    async (message: object) => {
      const { memberId, cooperativeId } = message as {
        memberId: string;
        cooperativeId: string;
      };
      logger.info(
        { memberId, cooperativeId },
        "Worker: received create-member-wallet message",
      );
      await processCreateMemberWallet(memberId, cooperativeId);
    },
    3,
  );

  // ── Cooperative wallet creation worker ───────────────────────────────────────
  await consumeQueue(
    CREATE_COOPERATIVE_WALLET_QUEUE,
    async (message: object) => {
      const { cooperativeId, walletName } = message as {
        cooperativeId: string;
        walletName: string;
      };
      logger.info(
        { cooperativeId, walletName },
        "Worker: received create-cooperative-wallet message",
      );
      await processCreateCooperativeWallet(cooperativeId, walletName);
    },
  );
}
