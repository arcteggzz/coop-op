import { Router } from "express";
import * as controller from "../controllers/systemSetupTest.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SystemSetupTest
 *   description: Endpoints to verify the project setup is working correctly
 */

/**
 * @swagger
 * /api/system-setup-test/notes:
 *   get:
 *     summary: Fetch all notes from the database
 *     tags: [SystemSetupTest]
 *     responses:
 *       200:
 *         description: List of all notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/notes", controller.getAllNotes);

/**
 * @swagger
 * /api/system-setup-test/notes/{id}:
 *   get:
 *     summary: Fetch a single note by ID
 *     tags: [SystemSetupTest]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The note UUID
 *     responses:
 *       200:
 *         description: The note object
 *       404:
 *         description: Note not found
 */
router.get("/notes/:id", controller.getNoteById);

/**
 * @swagger
 * /api/system-setup-test/notes:
 *   post:
 *     summary: Create a new note in the database
 *     tags: [SystemSetupTest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: My first note
 *               content:
 *                 type: string
 *                 example: This is the content of the note
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Validation error
 */
router.post("/notes", controller.createNote);

/**
 * @swagger
 * /api/system-setup-test/generate-pdf:
 *   post:
 *     summary: Generate a PDF and return a download URL
 *     tags: [SystemSetupTest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - schoolName
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               age:
 *                 type: integer
 *                 example: 12
 *               schoolName:
 *                 type: string
 *                 example: Excel Stealth Academy
 *     responses:
 *       200:
 *         description: Download URL for the generated PDF
 */
router.post("/generate-pdf", controller.generatePdfUrl);

/**
 * @swagger
 * /api/system-setup-test/stream-pdf:
 *   post:
 *     summary: Generate a PDF and stream it directly as a download
 *     tags: [SystemSetupTest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - schoolName
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               age:
 *                 type: integer
 *                 example: 10
 *               schoolName:
 *                 type: string
 *                 example: Excel Stealth Academy
 *     responses:
 *       200:
 *         description: PDF file streamed as a download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post("/stream-pdf", controller.streamPdf);

/**
 * @swagger
 * /api/system-setup-test/send-email:
 *   post:
 *     summary: Send a plain test email
 *     tags: [SystemSetupTest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *               - subject
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 example: test@example.com
 *               subject:
 *                 type: string
 *                 example: Hello from coop Op
 *     responses:
 *       200:
 *         description: Email sent successfully
 */
router.post("/send-email", controller.sendEmail);

/**
 * @swagger
 * /api/system-setup-test/send-email-attachment:
 *   post:
 *     summary: Send a test email with a small hardcoded attachment
 *     tags: [SystemSetupTest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 example: test@example.com
 *     responses:
 *       200:
 *         description: Email with attachment sent successfully
 */
router.post("/send-email-attachment", controller.sendEmailWithAttachment);

/**
 * @swagger
 * /api/system-setup-test/embedly-health:
 *   get:
 *     summary: Call the Embedly health check endpoint and return the response
 *     tags: [SystemSetupTest]
 *     responses:
 *       200:
 *         description: Embedly health check response
 */
router.get("/embedly-health", controller.embedlyHealthCheck);

/**
 * @swagger
 * /api/system-setup-test/validate-joi:
 *   post:
 *     summary: Test Joi DTO validation
 *     tags: [SystemSetupTest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - age
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               age:
 *                 type: integer
 *                 example: 25
 *               role:
 *                 type: string
 *                 enum: [admin, user, guest]
 *                 example: user
 *     responses:
 *       200:
 *         description: Validation passed, returns validated payload
 *       400:
 *         description: Validation failed with error messages
 */
router.post("/validate-joi", controller.joiValidationTest);

/**
 * @swagger
 * /api/system-setup-test/queue-test:
 *   post:
 *     summary: Insert a note, publish noteId to RabbitMQ, worker marks note as completed
 *     tags: [SystemSetupTest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Queue test note
 *               content:
 *                 type: string
 *                 example: This note will be marked complete by the worker
 *     responses:
 *       201:
 *         description: Note created and message sent to queue
 */
router.post("/queue-test", controller.queueTest);

export default router;
