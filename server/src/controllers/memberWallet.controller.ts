import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../middlewares/errorHandler";
import { AuthMemberRequest } from "../middlewares/memberAuthMiddleware";
import * as service from "../services/memberWalletData.service";

// ─── Get Wallet Details ───────────────────────────────────────────────────────

export async function getWalletDetails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cooperativeId = req.query.cooperativeId as string;
    if (!cooperativeId)
      throw new ValidationError('"cooperativeId" query param is required');

    const { id: memberId } = (req as AuthMemberRequest).memberUser;
    const result = await service.getMemberWalletDetails(
      memberId,
      cooperativeId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── Get Live Balance ─────────────────────────────────────────────────────────

export async function getWalletBalance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const schema = Joi.object({
      cooperativeId: Joi.string().required(),
      accountNumber: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) throw new ValidationError(error.message);

    const { id: memberId } = (req as AuthMemberRequest).memberUser;
    const result = await service.getMemberWalletBalance(
      memberId,
      value.cooperativeId,
      value.accountNumber,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── Get Recent Transactions ──────────────────────────────────────────────────

export async function getWalletTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cooperativeId = req.query.cooperativeId as string;
    if (!cooperativeId)
      throw new ValidationError('"cooperativeId" query param is required');

    const { id: memberId } = (req as AuthMemberRequest).memberUser;
    const result = await service.getMemberWalletTransactions(
      memberId,
      cooperativeId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── Export Statement ─────────────────────────────────────────────────────────

export async function exportStatement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const schema = Joi.object({
      accountNumber: Joi.string().required(),
      from: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required(),
      to: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required(),
      format: Joi.string().valid("csv", "pdf").required(),
      email: Joi.string().email().optional(),
      cooperativeId: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.message);

    const { id: memberId } = (req as AuthMemberRequest).memberUser;
    const result = await service.exportMemberWalletStatement(
      memberId,
      value.cooperativeId,
      value.accountNumber,
      value.from,
      value.to,
      value.format,
      value.email,
    );

    if ("sent" in result) {
      res.status(200).json({ success: true, data: { sent: true } });
      return;
    }

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
}
