import { Request, Response, NextFunction } from "express";
import * as service from "../services/systemSetupTest.service";
import {
  createNoteSchema,
  generatePdfSchema,
  sendEmailSchema,
  sendEmailWithAttachmentSchema,
  joiTestSchema,
  queueTestSchema,
} from "../validations/systemSetupTest.validation";
import { ValidationError } from "../middlewares/errorHandler";
import { logger } from "../utils/logger";

// ─── 1. GET all notes ────────────────────────────────────────────────────────
export async function getAllNotes(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: GET /notes");
    const notes = await service.getAllNotes();
    res.status(200).json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
}

// ─── 2. GET single note ──────────────────────────────────────────────────────
export async function getNoteById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    logger.info({ id }, "Controller: GET /notes/:id");
    const note = await service.getNoteById(id);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}

// ─── 3. POST create note ─────────────────────────────────────────────────────
export async function createNote(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /notes");
    const { error, value } = createNoteSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const note = await service.createNote(value.title, value.content);
    res
      .status(201)
      .json({
        success: true,
        message: "Note created successfully",
        data: note,
      });
  } catch (err) {
    next(err);
  }
}

// ─── 4a. POST generate PDF and return download URL ───────────────────────────
export async function generatePdfUrl(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /generate-pdf");
    const { error, value } = generatePdfSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const baseUrl = `${req.protocol}://${req.get("host") ?? "localhost:3000"}`;
    const downloadUrl = await service.generatePdfAndGetUrl(value, baseUrl);
    res.status(200).json({ success: true, data: { downloadUrl } });
  } catch (err) {
    next(err);
  }
}

// ─── 4b. POST stream PDF directly ────────────────────────────────────────────
export async function streamPdf(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /stream-pdf");
    const { error, value } = generatePdfSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const buffer = await service.generatePdfBuffer(value);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="coop-Op-test-${Date.now()}.pdf"`,
    );
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}

// ─── 5a. POST send email ─────────────────────────────────────────────────────
export async function sendEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /send-email");
    const { error, value } = sendEmailSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    await service.sendTestEmail(value.recipientEmail, value.subject);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── 5b. POST send email with attachment ─────────────────────────────────────
export async function sendEmailWithAttachment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /send-email-attachment");
    const { error, value } = sendEmailWithAttachmentSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    await service.sendTestEmailWithAttachment(value.recipientEmail);
    res
      .status(200)
      .json({
        success: true,
        message: "Email with attachment sent successfully",
      });
  } catch (err) {
    next(err);
  }
}

// ─── 6. GET Embedly health check ─────────────────────────────────────────────
export async function embedlyHealthCheck(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: GET /embedly-health");
    const data = await service.checkEmbedlyHealth();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── 7. POST Joi validation test ─────────────────────────────────────────────
export async function joiValidationTest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /validate-joi");
    const { error, value } = joiTestSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const messages = error.details.map((d) => d.message);
      throw new ValidationError(messages.join("; "));
    }
    res.status(200).json({
      success: true,
      message: "Validation passed",
      data: { validatedPayload: value },
    });
  } catch (err) {
    next(err);
  }
}

// ─── 8. POST queue test ──────────────────────────────────────────────────────
export async function queueTest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /queue-test");
    const { error, value } = queueTestSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const note = await service.createNoteAndPublishToQueue(
      value.title,
      value.content,
    );
    res.status(201).json({
      success: true,
      message:
        "Note created and message sent to queue. Worker will mark it as completed.",
      data: note,
    });
  } catch (err) {
    next(err);
  }
}
