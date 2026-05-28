import PDFDocument from "pdfkit";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { NotFoundError } from "../middlewares/errorHandler";
import { embedlyRequest } from "../utils/embedlyClient";
import { sendMail } from "../utils/mailer";
import * as embedlyRepo from "../repositories/embedly.repository";

interface EmbedlyWalletLiveData {
  availableBalance: number;
  ledgerBalance: number;
  virtualAccount: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
  };
}

interface EmbedlyWalletHistoryItem {
  id: string;
  remarks: string;
  amount: number;
  debitCreditIndicator: "D" | "C";
  balance: number;
  transactionReference: string;
  dateCreated: string;
  accountNumber: string;
  beneficiaryAccountName: string;
  beneficiaryAccountNumber: string;
  beneficiaryBank: string;
  originatorAccountNumber: string;
  originatorAccountName: string;
}

// ─── Wallet Details ───────────────────────────────────────────────────────────

export async function getMemberWalletDetails(
  memberId: string,
  cooperativeId: string,
) {
  logger.info({ memberId, cooperativeId }, "Service: getMemberWalletDetails");

  const wallet = await embedlyRepo.findMemberEmbedlyWalletByOwnerAndCooperative(
    memberId,
    cooperativeId,
  );
  if (!wallet)
    throw new NotFoundError(
      "Wallet not found for this member in this cooperative.",
    );

  return {
    walletName: wallet.WalletName ?? "My Wallet",
    accountNumber: wallet.AccountNumber,
    bankName: env.embedly.bankName,
  };
}

// ─── Live Balance ─────────────────────────────────────────────────────────────

export async function getMemberWalletBalance(
  memberId: string,
  cooperativeId: string,
  accountNumber: string,
) {
  logger.info(
    { memberId, cooperativeId, accountNumber },
    "Service: getMemberWalletBalance",
  );

  const wallet = await embedlyRepo.findMemberEmbedlyWalletByOwnerAndCooperative(
    memberId,
    cooperativeId,
  );
  if (!wallet)
    throw new NotFoundError(
      "Wallet not found for this member in this cooperative.",
    );

  const response = await embedlyRequest<{ data: EmbedlyWalletLiveData }>(
    "GET",
    `${env.embedly.urls.getWalletByAccountNumber}/${accountNumber}`,
  );

  return {
    availableBalance: response.data.data.availableBalance,
  };
}

// ─── Recent Transactions ──────────────────────────────────────────────────────

export async function getMemberWalletTransactions(
  memberId: string,
  cooperativeId: string,
) {
  logger.info(
    { memberId, cooperativeId },
    "Service: getMemberWalletTransactions",
  );

  const wallet = await embedlyRepo.findMemberEmbedlyWalletByOwnerAndCooperative(
    memberId,
    cooperativeId,
  );
  if (!wallet)
    throw new NotFoundError(
      "Wallet not found for this member in this cooperative.",
    );

  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);

  const toStr = to.toISOString().split("T")[0];
  const fromStr = from.toISOString().split("T")[0];

  const response = await embedlyRequest<{
    data: { walletHistories: EmbedlyWalletHistoryItem[] };
  }>("GET", env.embedly.urls.getWalletHistory, undefined, {
    params: {
      AccountNumber: wallet.AccountNumber,
      From: fromStr,
      To: toStr,
      PageNumber: "1",
      PageSize: "20",
    },
  });

  return response.data.data.walletHistories;
}

// ─── Statement Export ─────────────────────────────────────────────────────────

export async function exportMemberWalletStatement(
  memberId: string,
  cooperativeId: string,
  accountNumber: string,
  from: string,
  to: string,
  format: "csv" | "pdf",
  email?: string,
): Promise<
  { sent: true } | { buffer: Buffer; filename: string; contentType: string }
> {
  logger.info(
    { memberId, cooperativeId, accountNumber, from, to, format },
    "Service: exportMemberWalletStatement",
  );

  const wallet = await embedlyRepo.findMemberEmbedlyWalletByOwnerAndCooperative(
    memberId,
    cooperativeId,
  );
  if (!wallet)
    throw new NotFoundError(
      "Wallet not found for this member in this cooperative.",
    );

  // Fetch all transactions for the range (up to 500 for statement)
  const response = await embedlyRequest<{
    data: { walletHistories: EmbedlyWalletHistoryItem[] };
  }>("GET", env.embedly.urls.getWalletHistory, undefined, {
    params: {
      AccountNumber: accountNumber,
      From: from,
      To: to,
      PageNumber: "1",
      PageSize: "500",
    },
  });

  const transactions = response.data.data.walletHistories;

  let buffer: Buffer;
  let filename: string;
  let contentType: string;

  if (format === "csv") {
    const csvContent = buildCsv(transactions);
    buffer = Buffer.from(csvContent, "utf-8");
    filename = `statement_${from}_${to}.csv`;
    contentType = "text/csv";
  } else {
    buffer = await buildPdf(
      wallet.WalletName ?? "My Wallet",
      accountNumber,
      from,
      to,
      transactions,
    );
    filename = `statement_${from}_${to}.pdf`;
    contentType = "application/pdf";
  }

  if (email) {
    await sendMail({
      to: email,
      subject: `Your Wallet Statement (${from} to ${to})`,
      text: `Please find attached your wallet statement from ${from} to ${to}.`,
      template: "MEMBER_STATEMENT",
      referenceId: memberId,
      attachments: [{ filename, content: buffer, contentType }],
    });
    logger.info({ memberId, email }, "Service: statement emailed");
    return { sent: true };
  }

  return { buffer, filename, contentType };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCsv(transactions: EmbedlyWalletHistoryItem[]): string {
  const headers = [
    "Date",
    "Description",
    "Type",
    "Amount (NGN)",
    "Balance (NGN)",
    "Reference",
  ];
  const rows = transactions.map((t) => [
    new Date(t.dateCreated).toLocaleDateString("en-NG"),
    `"${(t.remarks ?? "").replace(/"/g, '""')}"`,
    t.debitCreditIndicator === "D" ? "Debit" : "Credit",
    t.amount.toFixed(2),
    t.balance.toFixed(2),
    t.transactionReference,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function buildPdf(
  walletName: string,
  accountNumber: string,
  from: string,
  to: string,
  transactions: EmbedlyWalletHistoryItem[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .fillColor("#7F56D9")
      .text("Wallet Statement", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(`Account: ${walletName} — ${accountNumber}`, { align: "center" })
      .text(`Period: ${from} to ${to}`, { align: "center" });
    doc.moveDown(1);

    // Table header
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text("Date", 40, doc.y, { width: 80, continued: false });

    const startY = doc.y;
    doc.text("Description", 125, startY - 12, { width: 180 });
    doc.text("Type", 310, startY - 12, { width: 45 });
    doc.text("Amount", 360, startY - 12, { width: 70, align: "right" });
    doc.text("Balance", 435, startY - 12, { width: 70, align: "right" });

    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#e5e7eb").stroke();
    doc.moveDown(0.3);

    // Rows
    for (const t of transactions) {
      if (doc.y > 760) {
        doc.addPage();
        doc.moveDown(0.5);
      }
      const y = doc.y;
      const dateStr = new Date(t.dateCreated).toLocaleDateString("en-NG");
      const isDebit = t.debitCreditIndicator === "D";
      const colour = isDebit ? "#dc2626" : "#16a34a";

      doc.fontSize(8).fillColor("#374151").text(dateStr, 40, y, { width: 80 });
      const desc = (t.remarks ?? "").substring(0, 60);
      doc.text(desc, 125, y, { width: 180 });
      doc
        .fillColor(colour)
        .text(isDebit ? "Debit" : "Credit", 310, y, { width: 45 });
      doc.text(
        `₦${t.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
        360,
        y,
        { width: 70, align: "right" },
      );
      doc
        .fillColor("#374151")
        .text(
          `₦${t.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
          435,
          y,
          { width: 70, align: "right" },
        );
      doc.moveDown(0.5);
    }

    if (transactions.length === 0) {
      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text("No transactions found for this period.", { align: "center" });
    }

    doc.end();
  });
}
