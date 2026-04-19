import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface InvoicePdfItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  itemPrice: number;
}

export interface InvoicePdfData {
  invoiceId: string;
  schoolName: string;
  schoolId: string;
  studentName: string;
  studentId: string;
  parentName: string;
  remarks: string;
  items: InvoicePdfItem[];
  subtotal: number;
  discount: number;
  amount: number;
  accountNumber: string;
  accountName: string;
  generatedAt: Date;
}

/**
 * Generates an invoice PDF and saves it to /public/pdfs/.
 * Returns the file name so the caller can build a download URL.
 */
export async function generateInvoicePdfAndSave(
  data: InvoicePdfData,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileName = `invoice-${data.invoiceId}.pdf`;
    const outputDir = path.resolve(__dirname, "../../public/pdfs");
    const outputPath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    _buildInvoicePdf(doc, data);

    doc.end();
    writeStream.on("finish", () => resolve(fileName));
    writeStream.on("error", reject);
  });
}

/**
 * Generates an invoice PDF and returns it as a Buffer (for email attachment).
 */
export async function generateInvoicePdfBuffer(
  data: InvoicePdfData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    _buildInvoicePdf(doc, data);

    doc.end();
  });
}

function _buildInvoicePdf(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
  const accentColor = "#1a73e8";
  const lineGray = "#cccccc";
  const labelColor = "#555555";

  // ── Header ──────────────────────────────────────────────────────────────────
  doc
    .fillColor(accentColor)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("Coop-op", { align: "center" });
  doc.moveDown(0.3);
  doc
    .fillColor(labelColor)
    .fontSize(11)
    .font("Helvetica")
    .text("School Collection Management Platform", { align: "center" });
  doc.moveDown(1);

  // Divider
  doc
    .strokeColor(accentColor)
    .lineWidth(1.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(1);

  // ── Invoice title & ID ───────────────────────────────────────────────────────
  doc
    .fillColor("#000000")
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("INVOICE", { align: "left" });
  doc.moveDown(0.4);
  doc
    .fillColor(labelColor)
    .fontSize(10)
    .font("Helvetica")
    .text(`Invoice ID: ${data.invoiceId}`);
  doc.text(`Date: ${data.generatedAt.toLocaleDateString("en-GB")}`);
  doc.moveDown(1);

  // ── School info ──────────────────────────────────────────────────────────────
  _sectionTitle(doc, "School Details");
  _row(doc, "School Name", data.schoolName);
  _row(doc, "School ID", data.schoolId);
  doc.moveDown(0.8);

  // ── Student & Parent info ────────────────────────────────────────────────────
  _sectionTitle(doc, "Student / Parent Details");
  _row(doc, "Student Name", data.studentName);
  _row(doc, "Student ID", data.studentId);
  _row(doc, "Parent Name", data.parentName);
  doc.moveDown(0.8);

  // ── Invoice Items ─────────────────────────────────────────────────────────────
  _sectionTitle(doc, "Invoice Items");

  const colX = { item: 50, qty: 250, unit: 330, total: 430 };
  const fmt = (n: number) =>
    `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  // Table header
  doc.fillColor("#ffffff").rect(50, doc.y, 495, 18).fill("#1a73e8");
  const headerY = doc.y - 14;
  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("Item", colX.item, headerY)
    .text("Qty", colX.qty, headerY)
    .text("Unit Price", colX.unit, headerY)
    .text("Total", colX.total, headerY);
  doc.moveDown(0.2);

  // Item rows
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const rowBg = i % 2 === 0 ? "#f8faff" : "#ffffff";
    const rowY = doc.y;
    doc.fillColor(rowBg).rect(50, rowY, 495, 16).fill();
    doc
      .fillColor("#333333")
      .fontSize(9)
      .font("Helvetica")
      .text(item.itemName, colX.item, rowY + 2, { width: 190 })
      .text(String(item.quantity), colX.qty, rowY + 2)
      .text(fmt(item.unitPrice), colX.unit, rowY + 2)
      .text(fmt(item.itemPrice), colX.total, rowY + 2);
    doc.moveDown(0.15);
  }

  doc.moveDown(0.5);

  // Subtotal / Discount / Total summary
  const summaryX = 350;
  const summaryValueX = 455;

  doc
    .fillColor("#333333")
    .fontSize(10)
    .font("Helvetica")
    .text("Subtotal:", summaryX, doc.y)
    .text(fmt(data.subtotal), summaryValueX, doc.y - 12, {
      align: "right",
      width: 90,
    });

  if (data.discount > 0) {
    doc.moveDown(0.3);
    doc
      .fillColor("#333333")
      .font("Helvetica")
      .text("Discount:", summaryX, doc.y)
      .text(`- ${fmt(data.discount)}`, summaryValueX, doc.y - 12, {
        align: "right",
        width: 90,
      });
  }

  doc.moveDown(0.3);
  doc
    .strokeColor("#1a73e8")
    .lineWidth(0.5)
    .moveTo(summaryX, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(0.3);
  doc
    .fillColor("#000000")
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Total Due:", summaryX, doc.y)
    .text(fmt(data.amount), summaryValueX, doc.y - 14, {
      align: "right",
      width: 90,
    });

  doc.moveDown(1);

  // ── Payment info ─────────────────────────────────────────────────────────────
  _sectionTitle(doc, "Payment Details");
  _row(doc, "Remarks", data.remarks || "N/A");
  _row(doc, "Account Number", data.accountNumber);
  _row(doc, "Account Name", data.accountName);
  _row(doc, "Bank", "Sterling Bank");
  doc.moveDown(1.5);

  // Divider
  doc
    .strokeColor(lineGray)
    .lineWidth(0.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(0.8);

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc
    .fillColor(labelColor)
    .fontSize(9)
    .text(
      "Please make payment by depositing the exact amount into the account number above.",
      { align: "center" },
    );
  doc.text("This invoice was generated by Coop-op.", { align: "center" });
}

function _sectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  doc.fillColor("#1a73e8").fontSize(11).font("Helvetica-Bold").text(title);
  doc.moveDown(0.3);
}

function _row(doc: PDFKit.PDFDocument, label: string, value: string): void {
  doc
    .fillColor("#333333")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(`${label}: `, { continued: true })
    .font("Helvetica")
    .fillColor("#000000")
    .text(value);
}

// ─── Bulk Class Invoice PDF ───────────────────────────────────────────────────

export interface BulkClassInvoicePdfItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  itemPrice: number;
}

export interface BulkClassInvoicePdfData {
  jobId: string;
  schoolName: string;
  className: string;
  remarks: string;
  items: BulkClassInvoicePdfItem[];
  subtotal: number;
  discount: number;
  amount: number;
  generatedAt: Date;
}

/**
 * Generates a class-level fee notice PDF and saves it to /public/pdfs/.
 * Returns the file name. This PDF is shared across all invoices in the bulk job.
 */
export async function generateBulkClassInvoicePdfAndSave(
  data: BulkClassInvoicePdfData,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileName = `bulk-invoice-${data.jobId}.pdf`;
    const outputDir = path.resolve(__dirname, "../../public/pdfs");
    const outputPath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    _buildBulkClassInvoicePdf(doc, data);

    doc.end();
    writeStream.on("finish", () => resolve(fileName));
    writeStream.on("error", reject);
  });
}

/**
 * Generates a class-level fee notice PDF and returns it as a Buffer (for email attachment).
 */
export async function generateBulkClassInvoicePdfBuffer(
  data: BulkClassInvoicePdfData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    _buildBulkClassInvoicePdf(doc, data);

    doc.end();
  });
}

function _buildBulkClassInvoicePdf(
  doc: PDFKit.PDFDocument,
  data: BulkClassInvoicePdfData,
): void {
  const accentColor = "#1a73e8";
  const lineGray = "#cccccc";
  const labelColor = "#555555";

  // ── Header ──────────────────────────────────────────────────────────────────
  doc
    .fillColor(accentColor)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("Coop-op", { align: "center" });
  doc.moveDown(0.3);
  doc
    .fillColor(labelColor)
    .fontSize(11)
    .font("Helvetica")
    .text("School Collection Management Platform", { align: "center" });
  doc.moveDown(1);

  // Divider
  doc
    .strokeColor(accentColor)
    .lineWidth(1.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(1);

  // ── Title ────────────────────────────────────────────────────────────────────
  doc
    .fillColor("#000000")
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("CLASS FEE NOTICE", { align: "left" });
  doc.moveDown(0.4);
  doc
    .fillColor(labelColor)
    .fontSize(10)
    .font("Helvetica")
    .text(`Job ID: ${data.jobId}`);
  doc.text(`Date: ${data.generatedAt.toLocaleDateString("en-GB")}`);
  doc.moveDown(1);

  // ── School info ──────────────────────────────────────────────────────────────
  _sectionTitle(doc, "School Details");
  _row(doc, "School Name", data.schoolName);
  doc.moveDown(0.8);

  // ── Class info ───────────────────────────────────────────────────────────────
  _sectionTitle(doc, "Class Details");
  _row(doc, "Class", data.className);
  doc.moveDown(0.8);

  // ── Invoice Items ─────────────────────────────────────────────────────────────
  _sectionTitle(doc, "Fee Items");

  const colX = { item: 50, qty: 250, unit: 330, total: 430 };
  const fmt = (n: number) =>
    `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  // Table header
  doc.fillColor("#ffffff").rect(50, doc.y, 495, 18).fill("#1a73e8");
  const headerY = doc.y - 14;
  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("Item", colX.item, headerY)
    .text("Qty", colX.qty, headerY)
    .text("Unit Price", colX.unit, headerY)
    .text("Total", colX.total, headerY);
  doc.moveDown(0.2);

  // Item rows
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const rowBg = i % 2 === 0 ? "#f8faff" : "#ffffff";
    const rowY = doc.y;
    doc.fillColor(rowBg).rect(50, rowY, 495, 16).fill();
    doc
      .fillColor("#333333")
      .fontSize(9)
      .font("Helvetica")
      .text(item.itemName, colX.item, rowY + 2, { width: 190 })
      .text(String(item.quantity), colX.qty, rowY + 2)
      .text(fmt(item.unitPrice), colX.unit, rowY + 2)
      .text(fmt(item.itemPrice), colX.total, rowY + 2);
    doc.moveDown(0.15);
  }

  doc.moveDown(0.5);

  // Subtotal / Discount / Total summary
  const summaryX = 350;
  const summaryValueX = 455;

  doc
    .fillColor("#333333")
    .fontSize(10)
    .font("Helvetica")
    .text("Subtotal:", summaryX, doc.y)
    .text(fmt(data.subtotal), summaryValueX, doc.y - 12, {
      align: "right",
      width: 90,
    });

  if (data.discount > 0) {
    doc.moveDown(0.3);
    doc
      .fillColor("#333333")
      .font("Helvetica")
      .text("Discount:", summaryX, doc.y)
      .text(`- ${fmt(data.discount)}`, summaryValueX, doc.y - 12, {
        align: "right",
        width: 90,
      });
  }

  doc.moveDown(0.3);
  doc
    .strokeColor("#1a73e8")
    .lineWidth(0.5)
    .moveTo(summaryX, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(0.3);
  doc
    .fillColor("#000000")
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Total Due:", summaryX, doc.y)
    .text(fmt(data.amount), summaryValueX, doc.y - 14, {
      align: "right",
      width: 90,
    });

  doc.moveDown(1);

  // ── Remarks ───────────────────────────────────────────────────────────────────
  if (data.remarks) {
    _sectionTitle(doc, "Remarks");
    _row(doc, "Note", data.remarks);
    doc.moveDown(0.8);
  }

  // ── Payment note ──────────────────────────────────────────────────────────────
  _sectionTitle(doc, "Payment Instructions");
  doc
    .fillColor("#333333")
    .fontSize(10)
    .font("Helvetica")
    .text(
      "Individual invoices will be sent to each student's parent. " +
        "Payment should be deposited into the student's individual Sterling Bank account number " +
        "as indicated in their personal invoice email.",
    );
  doc.moveDown(1.5);

  // Divider
  doc
    .strokeColor(lineGray)
    .lineWidth(0.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(0.8);

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc
    .fillColor(labelColor)
    .fontSize(9)
    .text("This fee notice was generated by Coop-op.", { align: "center" });
}

export interface PdfTestData {
  name: string;
  age: number;
  schoolName: string;
}

/**
 * Generates a PDF and saves it to /public/pdfs/.
 * Returns the file name so the caller can build a download URL.
 */
export async function generateTestPdfAndSave(
  data: PdfTestData,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileName = `test-${Date.now()}.pdf`;
    const outputDir = path.resolve(__dirname, "../../public/pdfs");
    const outputPath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);

    doc.fontSize(20).text("Coop-op — Test PDF", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${data.name}`);
    doc.text(`Age: ${data.age}`);
    doc.text(`School Name: ${data.schoolName}`);
    doc.moveDown();
    doc
      .fillColor("grey")
      .fontSize(10)
      .text(`Generated at: ${new Date().toISOString()}`);

    doc.end();

    writeStream.on("finish", () => resolve(fileName));
    writeStream.on("error", reject);
  });
}

/**
 * Generates a PDF and returns its content as a Buffer (for streaming).
 */
export async function generateTestPdfBuffer(
  data: PdfTestData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Coop-op — Test PDF (Streamed)", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${data.name}`);
    doc.text(`Age: ${data.age}`);
    doc.text(`School Name: ${data.schoolName}`);
    doc.moveDown();
    doc
      .fillColor("grey")
      .fontSize(10)
      .text(`Generated at: ${new Date().toISOString()}`);

    doc.end();
  });
}
