import nodemailer, { Transporter } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { pool } from '../config/database';
import { logger } from './logger';

let transporter: Transporter;

export function getMailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: {
        user: env.email.user,
        pass: env.email.password,
      },
    });
  }
  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  template?: string;
  referenceId?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const mailer = getMailTransporter();
  const template = options.template ?? 'GENERIC';
  let isSent = 0;

  try {
    const info = await mailer.sendMail({
      from: env.email.user,
      to: options.to,
      subject: options.subject,
      text: options.text,
      attachments: options.attachments,
    });
    isSent = 1;
    logger.info({ messageId: info.messageId, to: options.to, subject: options.subject }, 'Email sent');
  } finally {
    await pool.execute(
      `INSERT INTO EmailsLogs (Id, RecipientEmail, SenderEmail, Subject, Template, ReferenceId, IsSent, SentAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(6))`,
      [uuidv4(), options.to, env.email.user, options.subject, template, options.referenceId ?? null, isSent],
    );
  }
}
