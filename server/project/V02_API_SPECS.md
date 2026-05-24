# V02 API Specifications — Dues, Levies, Savings

> Follows all global conventions from API_SPECS.md: JSON responses, Bearer JWT auth, soft-delete filters, pagination.
> Success shape: `{ success: true, data: {} }`. Error shape: `{ success: false, error: { code, message } }`.
> Cooperative context for Manager and Member portals is supplied by the FE as `:cooperativeId` in the route path. The backend validates that the JWT owner (manager or member) belongs to that cooperative before proceeding.

---

## Permission Keys Added

### Back Office Admin (new)

| Key                | Grants                                         |
|--------------------|------------------------------------------------|
| `CoopDuesRead`     | GET endpoints on dues                          |
| `CoopDuesWrite`    | POST/PUT/PATCH/DELETE on dues                  |
| `CoopLeviesRead`   | GET endpoints on levies                        |
| `CoopLeviesWrite`  | POST/PUT/PATCH/DELETE on levies                |
| `CoopSavingsRead`  | GET endpoints on savings                       |
| `CoopSavingsWrite` | POST/PUT/PATCH/DELETE on savings               |

### Manager Portal (new)

| Key                       | Grants                                   |
|---------------------------|------------------------------------------|
| `ManagementDuesRead`      | GET endpoints on dues                    |
| `ManagementDuesWrite`     | POST/PUT/PATCH/DELETE on dues            |
| `ManagementLeviesRead`    | GET endpoints on levies                  |
| `ManagementLeviesWrite`   | POST/PUT/PATCH/DELETE on levies          |
| `ManagementSavingsRead`   | GET endpoints on savings                 |
| `ManagementSavingsWrite`  | POST/PUT/PATCH/DELETE on savings         |

---

---

## BACK OFFICE ADMIN — DUES

---

### 10. Controller: Coop Dues (per Cooperative)

Route prefix: `/api/coop-admin/cooperatives/:cooperativeId/dues`
File: `coop-dues.controller.ts`
Auth: All routes require valid admin JWT.

#### Permission guards
- GET routes require `CoopDuesRead` or `SuperAdmin`/`RootAdmin`.
- POST/PATCH/DELETE routes require `CoopDuesWrite` or `SuperAdmin`/`RootAdmin`.

---

#### a. POST /api/coop-admin/cooperatives/:cooperativeId/dues/schedules

Create a due schedule.

- Auth: `CoopDuesWrite` or higher.
- Validate `cooperativeId` exists, `DateDeleted IS NULL`. If not: 404 `COOPERATIVE_NOT_FOUND`.
- Receive DTO: `{ name, description?, amount, frequency, startDate, endDate? }`.
  - `frequency`: one of `Monthly | Quarterly | Biannual | Annual | OneTime`.
  - `amount`: positive decimal.
  - `startDate`: ISO date string.
- Insert into `DueSchedules`: `Id` = UUID v4, `IsActive = 1`, `CreatedById` = calling admin id, `CreatedByType = "Admin"`.
- Return: `{ schedule: { id, cooperativeId, name, description, amount, frequency, startDate, endDate, isActive, dateCreated } }`.

---

#### b. GET /api/coop-admin/cooperatives/:cooperativeId/dues/schedules

List all due schedules for a cooperative.

- Auth: `CoopDuesRead` or higher.
- Query params: `?page&pageSize&isActive`.
- Filter `DateDeleted IS NULL`, `CooperativeId = cooperativeId`.
- Return paginated list: `{ data: [{ id, name, amount, frequency, startDate, endDate, isActive, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

#### c. GET /api/coop-admin/cooperatives/:cooperativeId/dues/schedules/:scheduleId

Get a single due schedule.

- Auth: `CoopDuesRead` or higher.
- If not found or `DateDeleted IS NOT NULL`: 404 `DUE_SCHEDULE_NOT_FOUND`.
- Return: `{ id, cooperativeId, name, description, amount, frequency, startDate, endDate, isActive, dateCreated, dateUpdated }`.

---

#### d. PATCH /api/coop-admin/cooperatives/:cooperativeId/dues/schedules/:scheduleId

Update a due schedule.

- Auth: `CoopDuesWrite` or higher.
- Receive DTO: `{ name?, description?, amount?, frequency?, startDate?, endDate?, isActive? }` (partial update).
- Update `DueSchedules`: set provided fields, `DateUpdated = now()`.
- Return: `{ id, name, amount, frequency, startDate, endDate, isActive, dateUpdated }`.

---

#### e. DELETE /api/coop-admin/cooperatives/:cooperativeId/dues/schedules/:scheduleId

Soft-delete a due schedule.

- Auth: `CoopDuesWrite` or higher.
- Set `DateDeleted = now()`, `IsActive = 0`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Due schedule deleted" }`.

---

#### f. POST /api/coop-admin/cooperatives/:cooperativeId/dues/schedules/:scheduleId/issue

Issue dues for a period — creates a `DuePayments` record for every active member of this cooperative.

- Auth: `CoopDuesWrite` or higher.
- Receive DTO: `{ periodLabel, dueDate, amount? }`.
  - `periodLabel`: string (e.g. "April 2026"). Must be unique per schedule — check no existing `DuePayments` rows for this `DueScheduleId + PeriodLabel`.
  - `dueDate`: ISO date string.
  - `amount`: optional override; defaults to `DueSchedules.Amount`.
- If `periodLabel` already issued for this schedule: return 409 `DUE_PERIOD_ALREADY_ISSUED`.
- Fetch all active members: `MemberUsersCoperatives` where `CoperativeId = cooperativeId`, `DateDeleted IS NULL`, join `MemberUsers` where `IsActive = 1`.
- Insert one `DuePayments` row per member: `Status = 'Pending'`.
- Return: `{ periodLabel, dueDate, amount, membersIssued: N }`.

---

#### g. GET /api/coop-admin/cooperatives/:cooperativeId/dues/payments

List due payments for a cooperative (filterable).

- Auth: `CoopDuesRead` or higher.
- Query params: `?page&pageSize&scheduleId&memberId&periodLabel&status`.
- Join `DuePayments` with `MemberUsers`, `DueSchedules` where `CooperativeId = cooperativeId`.
- Return paginated list: `{ data: [{ id, scheduleId, scheduleName, memberId, memberFullName, periodLabel, dueDate, amount, status, paidDate, paidAmount, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

#### h. PATCH /api/coop-admin/cooperatives/:cooperativeId/dues/payments/:paymentId/record

Record a manual payment for a member's due.

- Auth: `CoopDuesWrite` or higher.
- Validate `paymentId` exists and belongs to `cooperativeId`. If not: 404 `DUE_PAYMENT_NOT_FOUND`.
- If `Status = 'Paid'`: return 409 `DUE_ALREADY_PAID`.
- Receive DTO: `{ paidAmount, notes? }`.
- Update `DuePayments`: `Status = 'Paid'`, `PaidDate = now()`, `PaidAmount = paidAmount`, `Notes`, `RecordedById` = calling admin id, `RecordedByType = 'Admin'`, `DateUpdated = now()`.
- Return: `{ id, memberId, periodLabel, status, paidDate, paidAmount }`.

---

#### i. PATCH /api/coop-admin/cooperatives/:cooperativeId/dues/payments/:paymentId/waive

Waive a member's due payment.

- Auth: `CoopDuesWrite` or higher.
- Validate payment exists and belongs to cooperative. If not: 404 `DUE_PAYMENT_NOT_FOUND`.
- If `Status = 'Paid'`: return 409 `DUE_ALREADY_PAID`.
- Receive DTO: `{ notes? }`.
- Update `DuePayments`: `Status = 'Waived'`, `RecordedById`, `RecordedByType = 'Admin'`, `Notes`, `DateUpdated = now()`.
- Return: `{ id, memberId, periodLabel, status, dateUpdated }`.

---

---

## MANAGER PORTAL — DUES

---

### 11. Controller: Management Dues

Route prefix: `/api/management/dues/:cooperativeId`
File: `management-dues.controller.ts`
Auth: All routes require valid manager JWT.

#### Permission guards
- GET routes require `ManagementDuesRead` or `SuperManager`/`RootManager`.
- POST/PATCH/DELETE routes require `ManagementDuesWrite` or `SuperManager`/`RootManager`.

All routes begin by validating that the calling manager belongs to `:cooperativeId` via `ManagementUsersCoperatives`. If not: return 403 `NOT_A_MANAGER_OF_THIS_COOPERATIVE`. Logic is otherwise identical to the Back Office Admin Dues controller; only the auth/permission layer differs. `RecordedByType` / `CreatedByType` = `'Manager'`.

- `POST /api/management/dues/:cooperativeId/schedules` — Create due schedule
- `GET /api/management/dues/:cooperativeId/schedules` — List schedules
- `GET /api/management/dues/:cooperativeId/schedules/:scheduleId` — Get schedule
- `PATCH /api/management/dues/:cooperativeId/schedules/:scheduleId` — Update schedule
- `DELETE /api/management/dues/:cooperativeId/schedules/:scheduleId` — Soft-delete schedule
- `POST /api/management/dues/:cooperativeId/schedules/:scheduleId/issue` — Issue dues for a period
- `GET /api/management/dues/:cooperativeId/payments` — List payments (same filters)
- `PATCH /api/management/dues/:cooperativeId/payments/:paymentId/record` — Record manual payment
- `PATCH /api/management/dues/:cooperativeId/payments/:paymentId/waive` — Waive payment

---

---

## MEMBER PORTAL — DUES

---

### 12. Controller: Member Dues

Route prefix: `/api/member/dues/:cooperativeId`
File: `member-dues.controller.ts`
Auth: All routes require valid member JWT.

All routes begin by validating that the calling member belongs to `:cooperativeId` via `MemberUsersCoperatives`. If not: return 403 `NOT_A_MEMBER_OF_THIS_COOPERATIVE`.

---

#### a. GET /api/member/dues/:cooperativeId/schedules

List active due schedules for the given cooperative.

- Filter `DueSchedules` where `CooperativeId = cooperativeId`, `IsActive = 1`, `DateDeleted IS NULL`.
- Return: `{ data: [{ id, name, description, amount, frequency, startDate, endDate }] }`.

---

#### b. GET /api/member/dues/:cooperativeId/payments

List the calling member's due payment records for the given cooperative.

- Query params: `?page&pageSize&scheduleId&periodLabel&status`.
- Filter `DuePayments` where `MemberId = memberId`, `CooperativeId = cooperativeId`.
- Return paginated list: `{ data: [{ id, scheduleId, scheduleName, periodLabel, dueDate, amount, status, paidDate, paidAmount }], page, pageSize, totalCount, totalPages }`.

---

#### c. GET /api/member/dues/:cooperativeId/payments/outstanding

List all Pending and Overdue due payments for the calling member in the given cooperative.

- Filter `DuePayments` where `MemberId = memberId`, `CooperativeId = cooperativeId`, `Status IN ('Pending','Overdue')`.
- Return: `{ data: [{ id, scheduleId, scheduleName, periodLabel, dueDate, amount, status }], totalOutstanding: N }`.

---

#### d. POST /api/member/dues/:cooperativeId/payments/:paymentId/pay

Pay a due from the member's wallet.

- Validate `paymentId` belongs to the calling member and `CooperativeId = cooperativeId`. If not: 404 `DUE_PAYMENT_NOT_FOUND`.
- If `Status = 'Paid'` or `Status = 'Waived'`: return 409 `DUE_ALREADY_PAID`.
- Check member's wallet balance via Embedly. If insufficient: return 400 `INSUFFICIENT_WALLET_BALANCE`.
- Initiate wallet debit via Embedly payout to cooperative wallet.
- On success: update `DuePayments`: `Status = 'Paid'`, `PaidDate = now()`, `PaidAmount = amount`, `RecordedById = memberId`, `RecordedByType = 'Member'`, `DateUpdated = now()`.
- Return: `{ id, periodLabel, status, paidDate, paidAmount }`.

---

---

## BACK OFFICE ADMIN — LEVIES

---

### 13. Controller: Coop Levies (per Cooperative)

Route prefix: `/api/coop-admin/cooperatives/:cooperativeId/levies`
File: `coop-levies.controller.ts`
Auth: All routes require valid admin JWT.

#### Permission guards
- GET routes require `CoopLeviesRead` or `SuperAdmin`/`RootAdmin`.
- POST/PATCH/DELETE routes require `CoopLeviesWrite` or `SuperAdmin`/`RootAdmin`.

---

#### a. POST /api/coop-admin/cooperatives/:cooperativeId/levies

Create a levy.

- Auth: `CoopLeviesWrite` or higher.
- Validate `cooperativeId` exists. If not: 404 `COOPERATIVE_NOT_FOUND`.
- Receive DTO: `{ name, description?, defaultAmount, dueDate }`.
- Insert into `Levies`: `Id` = UUID v4, `IsActive = 1`, `CreatedById`, `CreatedByType = 'Admin'`.
- Return: `{ levy: { id, cooperativeId, name, description, defaultAmount, dueDate, isActive, dateCreated } }`.

---

#### b. GET /api/coop-admin/cooperatives/:cooperativeId/levies

List levies for a cooperative.

- Auth: `CoopLeviesRead` or higher.
- Query params: `?page&pageSize&isActive`.
- Filter `DateDeleted IS NULL`, `CooperativeId = cooperativeId`.
- Return paginated list: `{ data: [{ id, name, defaultAmount, dueDate, isActive, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

#### c. GET /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId

Get a single levy with assignment summary.

- Auth: `CoopLeviesRead` or higher.
- If not found or deleted: 404 `LEVY_NOT_FOUND`.
- Return: `{ id, name, description, defaultAmount, dueDate, isActive, dateCreated, summary: { total, paid, pending, waived } }`.

---

#### d. PATCH /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId

Update a levy.

- Auth: `CoopLeviesWrite` or higher.
- Receive DTO: `{ name?, description?, defaultAmount?, dueDate?, isActive? }`.
- Update `Levies`, `DateUpdated = now()`.
- Return: `{ id, name, defaultAmount, dueDate, isActive, dateUpdated }`.

---

#### e. DELETE /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId

Soft-delete a levy.

- Auth: `CoopLeviesWrite` or higher.
- Set `DateDeleted = now()`, `IsActive = 0`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Levy deleted" }`.

---

#### f. POST /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId/assign

Assign a levy to members.

- Auth: `CoopLeviesWrite` or higher.
- Validate levy exists and belongs to cooperative.
- Receive DTO: `{ assignTo: 'all' | 'specific', memberIds?: string[], amountOverrides?: { memberId: string, amount: number }[] }`.
  - If `assignTo = 'all'`: fetch all active members of the cooperative.
  - If `assignTo = 'specific'`: use `memberIds`. Validate all members belong to cooperative.
- Skip members who already have an assignment for this levy (do not error — just skip; return `skipped` count).
- Insert `LevyAssignments` rows for each applicable member. Use `amountOverrides` if provided, else `Levies.DefaultAmount`.
- Return: `{ levyId, assigned: N, skipped: N }`.

---

#### g. GET /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId/assignments

List all member assignments for a levy.

- Auth: `CoopLeviesRead` or higher.
- Query params: `?page&pageSize&status`.
- Join `LevyAssignments` with `MemberUsers`.
- Return paginated list: `{ data: [{ id, memberId, memberFullName, amount, status, paidDate, paidAmount }], page, pageSize, totalCount, totalPages }`.

---

#### h. PATCH /api/coop-admin/cooperatives/:cooperativeId/levies/assignments/:assignmentId/record

Record a manual payment for a levy assignment.

- Auth: `CoopLeviesWrite` or higher.
- Validate assignment exists and belongs to cooperative. If not: 404 `LEVY_ASSIGNMENT_NOT_FOUND`.
- If `Status = 'Paid'`: return 409 `LEVY_ALREADY_PAID`.
- Receive DTO: `{ paidAmount, notes? }`.
- Update `LevyAssignments`: `Status = 'Paid'`, `PaidDate = now()`, `PaidAmount`, `Notes`, `RecordedById`, `RecordedByType = 'Admin'`, `DateUpdated = now()`.
- Return: `{ id, memberId, status, paidDate, paidAmount }`.

---

#### i. PATCH /api/coop-admin/cooperatives/:cooperativeId/levies/assignments/:assignmentId/waive

Waive a levy assignment.

- Auth: `CoopLeviesWrite` or higher.
- Validate assignment. If not found: 404 `LEVY_ASSIGNMENT_NOT_FOUND`.
- If `Status = 'Paid'`: return 409 `LEVY_ALREADY_PAID`.
- Receive DTO: `{ notes? }`.
- Update `LevyAssignments`: `Status = 'Waived'`, `RecordedById`, `RecordedByType = 'Admin'`, `Notes`, `DateUpdated = now()`.
- Return: `{ id, memberId, status, dateUpdated }`.

---

---

## MANAGER PORTAL — LEVIES

---

### 14. Controller: Management Levies

Route prefix: `/api/management/levies/:cooperativeId`
File: `management-levies.controller.ts`
Auth: All routes require valid manager JWT.

#### Permission guards
- GET routes require `ManagementLeviesRead` or `SuperManager`/`RootManager`.
- POST/PATCH/DELETE routes require `ManagementLeviesWrite` or `SuperManager`/`RootManager`.

All routes begin by validating that the calling manager belongs to `:cooperativeId` via `ManagementUsersCoperatives`. If not: return 403 `NOT_A_MANAGER_OF_THIS_COOPERATIVE`. Logic is otherwise identical to the Back Office Admin Levies controller. `CreatedByType` and `RecordedByType` = `'Manager'`.

- `POST /api/management/levies/:cooperativeId` — Create levy
- `GET /api/management/levies/:cooperativeId` — List levies
- `GET /api/management/levies/:cooperativeId/:levyId` — Get levy with summary
- `PATCH /api/management/levies/:cooperativeId/:levyId` — Update levy
- `DELETE /api/management/levies/:cooperativeId/:levyId` — Soft-delete levy
- `POST /api/management/levies/:cooperativeId/:levyId/assign` — Assign levy to members
- `GET /api/management/levies/:cooperativeId/:levyId/assignments` — List assignments
- `PATCH /api/management/levies/:cooperativeId/assignments/:assignmentId/record` — Record payment
- `PATCH /api/management/levies/:cooperativeId/assignments/:assignmentId/waive` — Waive assignment

---

---

## MEMBER PORTAL — LEVIES

---

### 15. Controller: Member Levies

Route prefix: `/api/member/levies/:cooperativeId`
File: `member-levies.controller.ts`
Auth: All routes require valid member JWT.

All routes begin by validating that the calling member belongs to `:cooperativeId` via `MemberUsersCoperatives`. If not: return 403 `NOT_A_MEMBER_OF_THIS_COOPERATIVE`.

---

#### a. GET /api/member/levies/:cooperativeId

List all levy assignments for the calling member in the given cooperative.

- Filter `LevyAssignments` where `MemberId = memberId`, `CooperativeId = cooperativeId`.
- Join `Levies` to get name and dueDate.
- Query params: `?page&pageSize&status`.
- Return paginated list: `{ data: [{ id, levyId, levyName, amount, dueDate, status, paidDate }], page, pageSize, totalCount, totalPages }`.

---

#### b. GET /api/member/levies/:cooperativeId/:assignmentId

Get a single levy assignment.

- Validate assignment belongs to calling member and `CooperativeId = cooperativeId`. If not: 404 `LEVY_ASSIGNMENT_NOT_FOUND`.
- Return: `{ id, levyId, levyName, levyDescription, amount, dueDate, status, paidDate, paidAmount }`.

---

#### c. POST /api/member/levies/:cooperativeId/:assignmentId/pay

Pay a levy from the member's wallet.

- Validate assignment belongs to calling member and `CooperativeId = cooperativeId`. If not: 404 `LEVY_ASSIGNMENT_NOT_FOUND`.
- If `Status = 'Paid'` or `Status = 'Waived'`: return 409 `LEVY_ALREADY_PAID`.
- Check wallet balance via Embedly. If insufficient: return 400 `INSUFFICIENT_WALLET_BALANCE`.
- Initiate wallet debit via Embedly payout to cooperative wallet.
- On success: update `LevyAssignments`: `Status = 'Paid'`, `PaidDate = now()`, `PaidAmount = amount`, `RecordedById = memberId`, `RecordedByType = 'Member'`, `DateUpdated = now()`.
- Return: `{ id, levyName, status, paidDate, paidAmount }`.

---

---

## BACK OFFICE ADMIN — SAVINGS

---

### 16. Controller: Coop Savings (per Cooperative)

Route prefix: `/api/coop-admin/cooperatives/:cooperativeId/savings`
File: `coop-savings.controller.ts`
Auth: All routes require valid admin JWT.

Savings plans are **member-owned**. Admins can view all plans across a cooperative and create/deposit/withdraw on a member's behalf when the member requests it.

#### Permission guards
- GET routes require `CoopSavingsRead` or `SuperAdmin`/`RootAdmin`.
- POST routes require `CoopSavingsWrite` or `SuperAdmin`/`RootAdmin`.

---

#### a. GET /api/coop-admin/cooperatives/:cooperativeId/savings/plans

List all member savings plans for a cooperative.

- Auth: `CoopSavingsRead` or higher.
- Validate `cooperativeId` exists. If not: 404 `COOPERATIVE_NOT_FOUND`.
- Query params: `?page&pageSize&memberId&status`.
- Filter `SavingsPlans` where `CooperativeId = cooperativeId`, `DateDeleted IS NULL`.
- Join `MemberUsers`.
- Return paginated list: `{ data: [{ id, memberId, memberFullName, name, targetAmount, contributionAmount, frequency, currentBalance, status, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

#### b. GET /api/coop-admin/cooperatives/:cooperativeId/savings/plans/:planId

Get a single member savings plan with recent transactions.

- Auth: `CoopSavingsRead` or higher.
- Validate plan belongs to `cooperativeId`. If not: 404 `SAVINGS_PLAN_NOT_FOUND`.
- Return: `{ id, memberId, memberFullName, name, description, targetAmount, contributionAmount, frequency, currentBalance, status, createdByType, dateCreated, transactions: [{ id, amount, type, reference, notes, recordedByType, dateCreated }] }`.
  - `transactions`: most recent 20, ordered by `DateCreated DESC`.

---

#### c. POST /api/coop-admin/cooperatives/:cooperativeId/savings/members/:memberId/plans

Create a savings plan on behalf of a member (at the member's request).

- Auth: `CoopSavingsWrite` or higher.
- Validate `cooperativeId` exists and `memberId` belongs to this cooperative. If not: 404 `MEMBER_NOT_FOUND`.
- Receive DTO: `{ name, description?, targetAmount?, contributionAmount?, frequency? }`.
  - All fields except `name` are optional — the member may define their own contribution cadence.
- Insert into `SavingsPlans`: `MemberId = memberId`, `CooperativeId = cooperativeId`, `CurrentBalance = 0`, `Status = 'Active'`, `CreatedById` = calling admin id, `CreatedByType = 'Admin'`.
- Return: `{ plan: { id, memberId, memberFullName, name, targetAmount, contributionAmount, frequency, currentBalance, status, dateCreated } }`.

---

#### d. POST /api/coop-admin/cooperatives/:cooperativeId/savings/plans/:planId/deposit

Record a deposit to a member's savings plan on their behalf.

- Auth: `CoopSavingsWrite` or higher.
- Validate plan belongs to `cooperativeId` and `Status = 'Active'`. If not active: 400 `SAVINGS_PLAN_CLOSED`.
- Receive DTO: `{ amount, reference?, notes? }`.
  - `amount`: positive decimal.
- Insert `SavingsTransactions`: `Type = 'Deposit'`, `RecordedById` = calling admin id, `RecordedByType = 'Admin'`.
- Update `SavingsPlans`: `CurrentBalance += amount`, `DateUpdated = now()`.
- Return: `{ transactionId, planId, newBalance, amount, dateCreated }`.

---

#### e. POST /api/coop-admin/cooperatives/:cooperativeId/savings/plans/:planId/withdraw

Record a withdrawal from a member's savings plan on their behalf.

- Auth: `CoopSavingsWrite` or higher.
- Validate plan belongs to `cooperativeId` and `Status = 'Active'`. If not: 400 `SAVINGS_PLAN_CLOSED`.
- Receive DTO: `{ amount, reference?, notes? }`.
- Validate `amount <= CurrentBalance`. If not: return 400 `INSUFFICIENT_SAVINGS_BALANCE`.
- Insert `SavingsTransactions`: `Type = 'Withdrawal'`, `RecordedById`, `RecordedByType = 'Admin'`.
- Update `SavingsPlans`: `CurrentBalance -= amount`, `DateUpdated = now()`.
- Return: `{ transactionId, planId, newBalance, amount, dateCreated }`.

---

---

## MANAGER PORTAL — SAVINGS

---

### 17. Controller: Management Savings

Route prefix: `/api/management/savings/:cooperativeId`
File: `management-savings.controller.ts`
Auth: All routes require valid manager JWT.

#### Permission guards
- GET routes require `ManagementSavingsRead` or `SuperManager`/`RootManager`.
- POST routes require `ManagementSavingsWrite` or `SuperManager`/`RootManager`.

All routes begin by validating the calling manager belongs to `:cooperativeId` via `ManagementUsersCoperatives`. If not: return 403 `NOT_A_MANAGER_OF_THIS_COOPERATIVE`. Logic is identical to the Back Office Admin Savings controller. `CreatedByType`/`RecordedByType` = `'Manager'`.

- `GET /api/management/savings/:cooperativeId/plans` — List all member savings plans for cooperative
- `GET /api/management/savings/:cooperativeId/plans/:planId` — Get plan + transactions
- `POST /api/management/savings/:cooperativeId/members/:memberId/plans` — Create plan on behalf of member
- `POST /api/management/savings/:cooperativeId/plans/:planId/deposit` — Record deposit on behalf of member
- `POST /api/management/savings/:cooperativeId/plans/:planId/withdraw` — Record withdrawal on behalf of member

---

---

## MEMBER PORTAL — SAVINGS

---

### 18. Controller: Member Savings

Route prefix: `/api/member/savings/:cooperativeId`
File: `member-savings.controller.ts`
Auth: All routes require valid member JWT.

All routes begin by validating the calling member belongs to `:cooperativeId` via `MemberUsersCoperatives`. If not: return 403 `NOT_A_MEMBER_OF_THIS_COOPERATIVE`. Members fully own and manage their own savings plans.

---

#### a. POST /api/member/savings/:cooperativeId/plans

Create a savings plan.

- Receive DTO: `{ name, description?, targetAmount?, contributionAmount?, frequency? }`.
- Insert into `SavingsPlans`: `MemberId = memberId`, `CooperativeId = cooperativeId`, `CurrentBalance = 0`, `Status = 'Active'`, `CreatedById = memberId`, `CreatedByType = 'Member'`.
- Return: `{ plan: { id, name, description, targetAmount, contributionAmount, frequency, currentBalance, status, dateCreated } }`.

---

#### b. GET /api/member/savings/:cooperativeId/plans

List the calling member's savings plans in the given cooperative.

- Filter `SavingsPlans` where `MemberId = memberId`, `CooperativeId = cooperativeId`, `DateDeleted IS NULL`.
- Query params: `?page&pageSize&status`.
- Return paginated list: `{ data: [{ id, name, targetAmount, contributionAmount, frequency, currentBalance, status, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

#### c. GET /api/member/savings/:cooperativeId/plans/:planId

Get a savings plan with transaction history.

- Validate plan belongs to calling member and `CooperativeId = cooperativeId`. If not: 404 `SAVINGS_PLAN_NOT_FOUND`.
- Return: `{ id, name, description, targetAmount, contributionAmount, frequency, currentBalance, status, dateCreated, transactions: [{ id, amount, type, reference, notes, recordedByType, dateCreated }] }` (most recent 20).

---

#### d. PATCH /api/member/savings/:cooperativeId/plans/:planId

Update a savings plan.

- Validate plan belongs to calling member. If not: 404 `SAVINGS_PLAN_NOT_FOUND`.
- Receive DTO: `{ name?, description?, targetAmount?, contributionAmount?, frequency?, status? }`.
  - `status`: may only be set to `'Paused'` or `'Active'` by the member. `'Closed'` is not allowed here — use DELETE.
- Update `SavingsPlans`, `DateUpdated = now()`.
- Return: `{ id, name, targetAmount, contributionAmount, frequency, status, dateUpdated }`.

---

#### e. DELETE /api/member/savings/:cooperativeId/plans/:planId

Close (soft-delete) a savings plan.

- Validate plan belongs to calling member. If not: 404 `SAVINGS_PLAN_NOT_FOUND`.
- Set `Status = 'Closed'`, `DateDeleted = now()`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Savings plan closed" }`.

---

#### f. POST /api/member/savings/:cooperativeId/plans/:planId/deposit

Deposit to savings from wallet.

- Validate plan belongs to calling member and `Status = 'Active'`. If not active: 400 `SAVINGS_PLAN_CLOSED`.
- Receive DTO: `{ amount, reference?, notes? }`.
- Check member's wallet balance via Embedly. If insufficient: 400 `INSUFFICIENT_WALLET_BALANCE`.
- Debit member wallet via Embedly payout to cooperative savings wallet.
- On success: insert `SavingsTransactions` (`Type = 'Deposit'`, `RecordedById = memberId`, `RecordedByType = 'Member'`), update `SavingsPlans.CurrentBalance += amount`.
- Return: `{ transactionId, planId, newBalance, amount, dateCreated }`.

---

#### g. POST /api/member/savings/:cooperativeId/plans/:planId/withdraw

Withdraw from savings to wallet.

- Validate plan belongs to calling member and `Status = 'Active'`. If not: 400 `SAVINGS_PLAN_CLOSED`.
- Receive DTO: `{ amount, notes? }`.
- Validate `amount <= CurrentBalance`. If not: return 400 `INSUFFICIENT_SAVINGS_BALANCE`.
- Credit member wallet via Embedly (payout from cooperative savings wallet to member wallet).
- On success: insert `SavingsTransactions` (`Type = 'Withdrawal'`, `RecordedById = memberId`, `RecordedByType = 'Member'`), update `SavingsPlans.CurrentBalance -= amount`.
- Return: `{ transactionId, planId, newBalance, amount, dateCreated }`.

---

---

## Error Code Reference Additions

| Code                          | HTTP Status | Meaning                                              |
|-------------------------------|-------------|------------------------------------------------------|
| `DUE_SCHEDULE_NOT_FOUND`      | 404         | No matching due schedule                             |
| `DUE_PAYMENT_NOT_FOUND`       | 404         | No matching due payment record                       |
| `DUE_PERIOD_ALREADY_ISSUED`   | 409         | Dues for this period have already been issued        |
| `DUE_ALREADY_PAID`            | 409         | Due payment is already marked as paid                |
| `LEVY_NOT_FOUND`              | 404         | No matching levy                                     |
| `LEVY_ASSIGNMENT_NOT_FOUND`   | 404         | No matching levy assignment                          |
| `LEVY_ALREADY_PAID`           | 409         | Levy assignment already paid or waived               |
| `SAVINGS_PLAN_NOT_FOUND`      | 404         | No matching savings plan                             |
| `SAVINGS_PLAN_CLOSED`         | 400         | Savings plan is not Active (Paused or Closed)        |
| `INSUFFICIENT_WALLET_BALANCE` | 400         | Wallet balance too low to cover the payment          |
| `INSUFFICIENT_SAVINGS_BALANCE`| 400         | Savings balance too low to cover the withdrawal      |
