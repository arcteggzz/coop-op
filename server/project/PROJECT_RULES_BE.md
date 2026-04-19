# Project Rules – Backend (Express.ts)

This document defines the rules and standards the AI must follow when generating code for this project.
All generated code must adhere to these conventions.

## 1. Technology Stack

The backend must use the following stack and dependencies:

- Node.ts
- Express.ts
- TypeScript
- MySQL for database (See env for database connection details)
- MySQL driver for now during the MVP stage (mysql2)
- Prisma for the ORM/query builder (use this later, ignore for now.)
- dotenv for environment variables
- Use RabbitMq for processing queue messages (amqplib). It's a MVP so use the simplest setup possible.
- Use Gmail and nodemailer for sending emails
- Use Embedly wallet api for managing wallets and transactions
- Email templates should be simple. Just send the basic data/text for each email template. Refer to Item 21 for template guidance.
- Use pdfkit for pdf generation.
- Use JOI for DTO validation library for simplicity.
- Use Pino for logging since it's better for performance
- Use db-migrate for migration and schema changes.
- Use Swagger UI for documentaton.

The AI must not introduce additional frameworks unless explicitly required and approved by the project team.

## 2. Project Folder Structure

The base folder for the backend is server. A route above this folder is the project root. There is a /client folder.
Everything outside the server folder is beyond the scope of the Backend.

The backend must follow this structure:

src/
├── config/
│ ├── database.ts
│ └── env.ts
│
├── controllers/
│
├── services/
│
├── repositories/
│
├── routes/
│
├── middlewares/
│
├── utils/
│
├── validations/
│
├── models/
│
└── app.ts

Rules:

- Controllers handle HTTP logic only
- Services contain business logic
- Repositories handle database access
- Routes define endpoints
- Middlewares handle auth, validation, etc

## 3. Controller Rules

Controllers must:

- Be thin
- Not contain business logic
- Only handle:
  - request parsing
  - response formatting
  - calling services

Example pattern:
controller -> service -> repository -> database

async function createUser(req, res) {
const user = await userService.createUser(req.body)

res.status(201).json({
success: true,
data: user
})
}

## 4. Service Layer Rules

Services contain all business logic.
Services:

- Validate business rules
- Call repositories
- Handle transactions if needed

Services must not depend on Express objects (req, res).

## 5. Repository Layer Rules

Repositories are responsible for database queries only.
They should:

- Not contain business logic
- Only interact with the ORM or database

Example:
async function findUserByEmail(email) {
return db.user.findUnique({
where: { email }
})
}

## 6. Environment Variables

All configuration must come from .env.

Example .env variables:
PORT=3000
NODE_ENV=development
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
LOG_LEVEL=

Rules:

- Never hardcode secrets
- Environment variables must be accessed through a config module

Example:
src/config/env.ts

## 7. Database Rules

Database rules:

- Use migrations for schema changes
- Never run raw SQL in controllers
- Use repository layer for queries
- Transactions must be handled in service layer
- Naming conventions:
  - Tables: PascalCase
  - Columns: PascalCase
  - Primary keys: Id (UUID preferred) (all tables must have a primary key)
  - Timestamps: DateCreated, DateUpdated, DateDeleted (soft delete) => in utcTimestamp(6)

## 8. Error Handling

All errors must use centralized error handling.
Create: middlewares/errorHandler.ts
Example response:
{
"success": false,
"error": {
"code": "USER_NOT_FOUND",
"message": "User does not exist"
}
}
Rules:

- Never expose internal stack traces
- Use custom error classes for different types of errors
- Log errors with Pino
- Return appropriate HTTP status codes

## 9. Logging

All logs must use structured logging.
Use: Pino
Log levels:

- error
- warn
- info
- debug

Example: logger.info("User created", { userId: user.id })
Never log:

- passwords
- tokens
- sensitive financial data

## 10. Validation Rules

    All request payloads must be validated.
    Use: Joi or Zod
    Validation must occur in middleware before controllers.

Example: routes -> validation middleware -> controller

## 11. API Response Format

    All APIs must return consistent responses.

Success:
{
"success": true,
"data": {}
}

Error:
{
"success": false,
"error": {
"code": "",
"message": ""
}
}

## 12. Authentication Rules and JWT

- Authentication must use: JWT
- Tokens must be sent via:
  Authorization: Bearer <token>
- Protected routes must use an authMiddleware.
- JWT should have claims for { managerId | memberId | adminId }. Consider that JWT for Admin, Member and Manager are handled in different controllers and different tables.

## 13. Security Rules

    The project must include:

- Helmet
- CORS configuration
- Rate limiting
- Input validation
- SQL injection protection via ORM
- Never trust client input.

## 14. Testing Rules

    Testing framework: Jest

Tests must include:

- unit tests for services
- integration tests for routes

Tests must not use production databases.

## 15. Naming Conventions

- Variables: camelCase
- Files: kebab-case
- Classes: PascalCase
- Constants: UPPER_CASE

## 16. Commit Rules

    Use structured commits:
    feat:
    fix:
    refactor:
    test:
    docs:

Example: feat: add user registration endpoint

## 17. Performance Rules

    Avoid:

- N+1 queries
- blocking operations
- synchronous file operations

Always use async/await.

## 18. Documentation

- Endpoints must include:
  - description
  - request example
  - response example
  - error codes
- Use Swagger.

## 19. General AI Rules

    When generating code:

- Follow project architecture
- Avoid unnecessary dependencies
- Reuse existing modules
- Write readable code
- Add comments for complex logic

## 20. Development MVP Speed

    During MVP stage, skip

- Complex database queries (Use the official MySQL driver durign MVP)
- Caching strategies
- Performance optimizations
- Testing (Item 14)
- Security Rules (Item 13)

## 21. Email Templates

- For the MVP, we will use very simple and plain email templates. No design or UI.
- Just a subject (text).
- The body should send all the important data for that particular template.
- No need for EJS for the MVP.
- For example, template for Wallet Creation
  - Subject: Wallet Created for Member
  - Body: Member Name, coperative Id, Account Number, Account name

## 22. Pagination on GET routes

- When writing get endpoints (for lists), ensure to build pagination from the start.
- THe UI and the endpoint should come prebuilt with pagination (page size, total pages, etc.)
