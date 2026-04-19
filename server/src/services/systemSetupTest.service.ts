import * as repo from "../repositories/systemSetupTest.repository";
import { Note } from "../models/note";
import { sendMail } from "../utils/mailer";
import {
  generateTestPdfAndSave,
  generateTestPdfBuffer,
  PdfTestData,
} from "../utils/pdfGenerator";
import { embedlyRequest } from "../utils/embedlyClient";
import { publishToQueue } from "../utils/queue";
import { logger } from "../utils/logger";
import { NotFoundError } from "../middlewares/errorHandler";

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function getAllNotes(): Promise<Note[]> {
  logger.info("Service: getAllNotes");
  return repo.getAllNotes();
}

export async function getNoteById(id: number): Promise<Note> {
  logger.info({ id }, "Service: getNoteById");
  const note = await repo.getNoteById(id);
  if (!note) throw new NotFoundError(`Note with id ${id} not found`);
  return note;
}

export async function createNote(
  title: string,
  content: string,
): Promise<Note> {
  logger.info({ title }, "Service: createNote");
  return repo.createNote(title, content);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export async function generatePdfAndGetUrl(
  data: PdfTestData,
  baseUrl: string,
): Promise<string> {
  logger.info({ data }, "Service: generatePdfAndGetUrl");
  const fileName = await generateTestPdfAndSave(data);
  const downloadUrl = `${baseUrl}/pdfs/${fileName}`;
  logger.info({ downloadUrl }, "PDF saved, download URL built");
  return downloadUrl;
}

export async function generatePdfBuffer(data: PdfTestData): Promise<Buffer> {
  logger.info({ data }, "Service: generatePdfBuffer (stream)");
  return generateTestPdfBuffer(data);
}

// ─── Email ───────────────────────────────────────────────────────────────────

export async function sendTestEmail(
  recipientEmail: string,
  subject: string,
): Promise<void> {
  const sentAt = new Date().toISOString();
  logger.info({ recipientEmail, subject }, "Service: sendTestEmail");
  await sendMail({
    to: recipientEmail,
    subject,
    text: `This is a test email from coop Op.\n\nSent at: ${sentAt}`,
    referenceId: `test-email-${sentAt}`,
    template: "TEST_EMAIL",
  });
}

export async function sendTestEmailWithAttachment(
  recipientEmail: string,
): Promise<void> {
  const sentAt = new Date().toISOString();
  logger.info({ recipientEmail }, "Service: sendTestEmailWithAttachment");

  // Small hardcoded attachment — a plain text file
  const attachmentContent = Buffer.from(
    `Coop Op Test Attachment\nGenerated at: ${sentAt}\nThis is a small test file attached to your email.`,
    "utf-8",
  );

  await sendMail({
    to: recipientEmail,
    subject: "Coop Op Test Email with Attachment",
    text: `Hi,\n\nThis test email includes an attachment.\n\nSent at: ${sentAt}`,
    attachments: [
      {
        filename: "coop-op-test-attachment.txt",
        content: attachmentContent,
        contentType: "text/plain",
      },
    ],
    referenceId: `test-email-${sentAt}`,
    template: "TEST_EMAIL",
  });
}

// ─── Embedly ─────────────────────────────────────────────────────────────────

export async function checkEmbedlyHealth(): Promise<unknown> {
  logger.info("Service: checkEmbedlyHealth");
  // Health check is on a different base URL — pass the full URL override
  const response = await embedlyRequest("GET", "", undefined, {
    url: "https://waas-staging.embedly.ng/WaasCore/api/v1/system/health-check?message=u",
  });
  return response.data;
}

// ─── Queue ───────────────────────────────────────────────────────────────────

export async function createNoteAndPublishToQueue(
  title: string,
  content: string,
): Promise<Note> {
  logger.info({ title }, "Service: createNoteAndPublishToQueue");
  const note = await repo.createNote(title, content);
  const message = { noteId: note.Id };
  await publishToQueue("note-completion", message);
  logger.info(
    { noteId: note.Id },
    "Service: note created and message published to queue",
  );
  return note;
}

export async function markNoteCompleted(noteId: number): Promise<void> {
  logger.info(
    { noteId },
    "Service: markNoteCompleted (called by queue consumer)",
  );
  await repo.markNoteCompleted(noteId);
}
