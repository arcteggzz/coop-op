# Coop-op API Specifications

> All routes return JSON. Success shape: `{ success: true, data: {} }`. Error shape: `{ success: false, error: { code: "", message: "" } }`.
> All protected routes require `Authorization: Bearer <token>`.
> Soft-delete check: always filter `DateDeleted IS NULL` and `IsActive = 1`.
> Pagination: all list endpoints accept `?page=1&pageSize=20` and return `{ data: [], page, pageSize, totalCount, totalPages }`.

---

## Permission Keys Reference

Permission keys are controller-scoped strings assigned to `Admin` and `Support` role users. `SuperAdmin`, `RootAdmin`, `SuperManager`, and `RootManager` implicitly have all permissions and do not use this table.

### Back Office Admin Permission Keys (prefix: `Coop`)

| Key                      | Grants                                           |
| ------------------------ | ------------------------------------------------ |
| `CoopAdminRead`          | GET endpoints on admin management                |
| `CoopAdminWrite`         | POST/PUT/PATCH/DELETE on admin management        |
| `CoopCooperativesRead`   | GET endpoints on cooperatives                    |
| `CoopCooperativesWrite`  | POST/PUT/PATCH/DELETE on cooperatives            |
| `CoopManagersRead`       | GET endpoints on cooperative managers            |
| `CoopManagersWrite`      | POST/PUT/PATCH/DELETE on cooperative managers    |
| `CoopMembersRead`        | GET endpoints on cooperative members             |
| `CoopMembersWrite`       | POST/PUT/PATCH/DELETE on cooperative members     |
| `CoopLoansRead`          | GET endpoints on loans (future)                  |
| `CoopLoansWrite`         | POST/PUT/PATCH/DELETE on loans (future)          |
| `CoopDuesRead`           | GET endpoints on dues (future)                   |
| `CoopDuesWrite`          | POST/PUT/PATCH/DELETE on dues (future)           |
| `CoopAjoManagementRead`  | GET endpoints on ajo management (future)         |
| `CoopAjoManagementWrite` | POST/PUT/PATCH/DELETE on ajo management (future) |

### Manager Permission Keys (prefix: `Management`)

| Key                            | Grants                                           |
| ------------------------------ | ------------------------------------------------ |
| `ManagementAdminRead`          | GET endpoints on manager management              |
| `ManagementAdminWrite`         | POST/PUT/PATCH/DELETE on manager management      |
| `ManagementMembersRead`        | GET endpoints on members                         |
| `ManagementMembersWrite`       | POST/PUT/PATCH/DELETE on members                 |
| `ManagementLoansRead`          | GET endpoints on loans (future)                  |
| `ManagementLoansWrite`         | POST/PUT/PATCH/DELETE on loans (future)          |
| `ManagementDuesRead`           | GET endpoints on dues (future)                   |
| `ManagementDuesWrite`          | POST/PUT/PATCH/DELETE on dues (future)           |
| `ManagementAjoManagementRead`  | GET endpoints on ajo management (future)         |
| `ManagementAjoManagementWrite` | POST/PUT/PATCH/DELETE on ajo management (future) |

---

---

## BACK OFFICE ADMIN

---

### 1. Controller: Coop Admin Authentication

Route prefix: `/api/coop-admin`
File: `coop-admin-auth.controller.ts`

---

### a. POST /api/coop-admin/login

- Receive DTO: `{ email, password }`.
- Look up admin in `AdminUsers` where `Email = email`, `IsActive = 1`, `DateDeleted IS NULL`.
- If not found or inactive: return 401 `INVALID_CREDENTIALS`.
- Compare `password` with stored bcrypt hash (10 rounds).
- If mismatch: return 401 `INVALID_CREDENTIALS`.
- Generate JWT: `{ sub: id, type: "admin", role, email }`.
- Always include `requiresPasswordChange` in response: `true` if `DefaultPasswordChanged = 0`, else `false`.
- Frontend must redirect to `/admin/change-password` when `requiresPasswordChange = true`.
- Return: `{ token, requiresPasswordChange, admin: { id, fullName, email, role, isActive, defaultPasswordChanged, dateInvited } }`.

---

### b. POST /api/coop-admin/request-otp

Used during password change flow — step 1.

- Receive DTO: `{ email }`.
- Validate email exists in `AdminUsers` where `IsActive = 1`, `DateDeleted IS NULL`.
- If not found: return 404 `ADMIN_NOT_FOUND`.
- Generate a 6-digit OTP. Store it temporarily (in-memory or DB table with expiry of 10 minutes).
- Send OTP to the email via nodemailer.
- Return: `{ success: true, message: "OTP sent to email" }`.

---

### c. POST /api/coop-admin/verify-otp-and-change-password

Used during password change flow — step 2.

- Receive DTO: `{ email, otp, newPassword, confirmPassword }`.
- Validate `newPassword === confirmPassword`. If not: return 400 `PASSWORD_MISMATCH`.
- Look up stored OTP for this email. If not found or expired: return 400 `INVALID_OR_EXPIRED_OTP`.
- If OTP does not match: return 400 `INVALID_OR_EXPIRED_OTP`.
- Hash `newPassword` with bcrypt (10 rounds).
- Update `AdminUsers`: set `Password = hashedPassword`, `DefaultPasswordChanged = 1`, `DateUpdated = now()`.
- Invalidate/delete the OTP.
- Return: `{ success: true, message: "Password changed successfully" }`.

---

---

### 2. Controller: Coop Admin Management

Route prefix: `/api/coop-admin/admins`
File: `coop-admin-management.controller.ts`
Auth: All routes require valid admin JWT.

### Permission guards

- GET routes require `CoopAdminRead` (or `SuperAdmin` / `RootAdmin`).
- POST/PUT/PATCH/DELETE routes require `CoopAdminWrite` (or `SuperAdmin` / `RootAdmin`).
- Exception: only `RootAdmin` can revoke a `SuperAdmin`. `SuperAdmin` cannot touch other `SuperAdmin` accounts.

---

### a. POST /api/coop-admin/admins/invite

Invite a new Back Office Admin.

- Auth: `SuperAdmin` or `RootAdmin` only.
- Receive DTO: `{ fullName, email, role, permissions? }`.
  - `role` must be one of `SuperAdmin` or `Admin`. (`RootAdmin` cannot be invited — seeded directly.)
  - `permissions` is required when `role = "Admin"`. Must be an array of valid permission keys from the Back Office Admin Permission Keys table above. Ignored if `role = "SuperAdmin"`.
- Validate `email` is unique in `AdminUsers`. If taken: return 409 `EMAIL_ALREADY_EXISTS`.
- Create row in `AdminUsers`:
  - `Id` = UUID v4
  - `FullName`, `Email`, `Role` from DTO
  - `Password` = bcrypt hash of `SecurePassword123` (10 rounds)
  - `IsActive = 1`, `DefaultPasswordChanged = 0`
  - `DateInvited = now()`, `DateCreated = now()`
  - `InvitedByAdminId` = id of the calling admin from JWT
- If `role = "Admin"`: insert one row per permission key into `AdminPermissions` table.
- Send invite email: subject `"You've been invited to Coop-op Admin Portal"`, body includes `fullName`, `email`, `role`, login link, default password.
- Return: `{ admin: { id, fullName, email, role, dateInvited } }`.

---

### b. GET /api/coop-admin/admins

List all Back Office Admins.

- Auth: `CoopAdminRead` or higher.
- Query params: `?page&pageSize&role&isActive`.
- Filter `DateDeleted IS NULL`.
- Return paginated list: `{ data: [{ id, fullName, email, role, isActive, defaultPasswordChanged, dateInvited, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

### c. GET /api/coop-admin/admins/:adminId

Get a single Admin by ID.

- Auth: `CoopAdminRead` or higher.
- If not found or `DateDeleted IS NOT NULL`: return 404 `ADMIN_NOT_FOUND`.
- Return: `{ id, fullName, email, role, isActive, defaultPasswordChanged, dateInvited, dateCreated, permissions: [] }`.
  - `permissions` is populated from `AdminPermissions` for `Admin` role. Empty array for `SuperAdmin`/`RootAdmin` (they have implicit full access).

---

### d. PATCH /api/coop-admin/admins/:adminId/permissions

Update permissions for an `Admin` role user.

- Auth: `SuperAdmin` or `RootAdmin` only.
- Cannot update permissions of a `SuperAdmin` or `RootAdmin` (they have implicit full access). Return 400 `CANNOT_MODIFY_SUPER_ADMIN_PERMISSIONS`.
- Receive DTO: `{ permissions: string[] }` — full replacement of current permission set.
- Validate all keys are valid Back Office Admin Permission Keys.
- Delete existing rows in `AdminPermissions` for this admin. Insert new rows.
- Return: `{ id, fullName, email, role, permissions: [] }`.

---

### e. PATCH /api/coop-admin/admins/:adminId/revoke

Revoke (deactivate) an Admin's access.

- Auth: `RootAdmin` can revoke anyone. `SuperAdmin` can revoke `Admin` only — not other `SuperAdmin`s.
- If calling `SuperAdmin` tries to revoke a `SuperAdmin`: return 403 `INSUFFICIENT_PERMISSIONS`.
- Set `IsActive = 0`, `DateUpdated = now()` in `AdminUsers`.
- Return: `{ success: true, message: "Access revoked" }`.

---

### f. PATCH /api/coop-admin/admins/:adminId/restore

Restore (reactivate) a previously revoked Admin.

- Auth: `SuperAdmin` or `RootAdmin`.
- Set `IsActive = 1`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Access restored" }`.

---

### g. DELETE /api/coop-admin/admins/:adminId

Soft-delete an Admin.

- Auth: `RootAdmin` only.
- Cannot delete self. Cannot delete another `RootAdmin`.
- Set `DateDeleted = now()`, `IsActive = 0`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Admin deleted" }`.

---

---

### 3. Controller: Coop Cooperatives

Route prefix: `/api/coop-admin/cooperatives`
File: `coop-cooperatives.controller.ts`
Auth: All routes require valid admin JWT.

### Permission guards

- GET routes require `CoopCooperativesRead` or higher.
- POST/PUT/PATCH/DELETE routes require `CoopCooperativesWrite` or higher.

---

### a. POST /api/coop-admin/cooperatives

Create a new Cooperative.

- Auth: `CoopCooperativesWrite` or higher.
- Receive DTO: `{ name }`.
- Validate `name` is not empty.
- Create row in `Cooperatives`:
  - `Id` = UUID v4
  - `Name` from DTO
  - `CreatedByAdminId` = calling admin id from JWT
  - `CreatedByAdminType` = `"Admin"`
  - `DateCreated = now()`
- Return: `{ cooperative: { id, name, dateCreated } }`.

---

### b. GET /api/coop-admin/cooperatives

List all Cooperatives.

- Auth: `CoopCooperativesRead` or higher.
- Query params: `?page&pageSize&search` (search on `Name`).
- Filter `DateDeleted IS NULL`.
- Return paginated list: `{ data: [{ id, name, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

### c. GET /api/coop-admin/cooperatives/:cooperativeId

Get a single Cooperative with its properties.

- Auth: `CoopCooperativesRead` or higher.
- If not found: return 404 `COOPERATIVE_NOT_FOUND`.
- Fetch rows from `CoperativesProperties` where `CoperativeId = cooperativeId`, `DateDeleted IS NULL`, `IsActive = 1`.
- Return: `{ id, name, dateCreated, properties: [{ key, value, groupName }] }`.

---

### d. PATCH /api/coop-admin/cooperatives/:cooperativeId

Update Cooperative name.

- Auth: `CoopCooperativesWrite` or higher.
- Receive DTO: `{ name }`.
- Update `Cooperatives`: `Name = name`, `DateUpdated = now()`.
- Return: `{ id, name, dateUpdated }`.

---

### e. DELETE /api/coop-admin/cooperatives/:cooperativeId

Soft-delete a Cooperative.

- Auth: `RootAdmin` or `SuperAdmin` only.
- Set `DateDeleted = now()`, `DateUpdated = now()` on `Cooperatives`.
- Return: `{ success: true, message: "Cooperative deleted" }`.

---

---

### f. POST /api/coop-admin/cooperatives/:cooperativeId/create-wallet

Create a new wallet for a Cooperative.

- Auth: `CoopCooperativesWrite` or higher.
- Receive DTO: `{ walletName }`.
- Validate `walletName` is not empty.
- Validate Cooperative exists and publish a message to the queue for wallet creation. Similar to what we did for member wallet but this time its for coperative.
- Return: `{ cooperative: { id, name, dateCreated } }`.

---

---

### 4. Controller: Coop Managers (per Cooperative)

Route prefix: `/api/coop-admin/cooperatives/:cooperativeId/managers`
File: `coop-managers.controller.ts`
Auth: All routes require valid admin JWT.

### Permission guards

- GET routes require `CoopManagersRead` or higher.
- POST/PUT/PATCH/DELETE routes require `CoopManagersWrite` or higher.

---

### a. POST /api/coop-admin/cooperatives/:cooperativeId/managers/invite

Invite a Manager to a Cooperative.

- Auth: `CoopManagersWrite` or higher.
- Validate `cooperativeId` exists and `DateDeleted IS NULL`. If not: return 404 `COOPERATIVE_NOT_FOUND`.
- Receive DTO: `{ fullName, email, role, permissions? }`.
  - `role` must be one of `RootManager`, `SuperManager`, `Support`.
  - Only one `RootManager` is allowed per cooperative. Check `ManagementUsersCoperatives` where `CoperativeId = cooperativeId` and `Role = "RootManager"`. If exists: return 409 `ROOT_MANAGER_ALREADY_EXISTS`.
  - `permissions` required when `role = "Support"`. Must be valid Management Permission Keys. Ignored otherwise.
- Check if `email` already exists in `ManagementUsers`:
  - If exists: reuse that `ManagementUsers` row (multi-tenancy — same person can manage multiple cooperatives).
  - If not exists: create new row in `ManagementUsers`:
    - `Id` = UUID v4, `FullName`, `Email`
    - `Password` = bcrypt hash of `SecurePassword123`
    - `IsActive = 1`, `DefaultPasswordChanged = 0`
    - `DateInvited = now()`, `DateCreated = now()`
    - `InvitedByAdminId` = calling admin id, `InvitedByAdminType = "Admin"`
- Create row in `ManagementUsersCoperatives`:
  - `Id` = UUID v4, `ManagerId`, `CoperativeId`, `Role`
  - `IsDefault = true` if thir's is the manages first cooperative, else `false`
  - `DateCreated = now()`
- If `role = "Support"`: insert rows into `ManagementUserPermissions` for this manager + cooperative.
- Send invite email: subject `"You've been invited to manage a Cooperative on Coop-op"`, body includes `fullName`, `email`, cooperative name, `role`, login link, default password.
- Return: `{ manager: { id, fullName, email, role, cooperativeId, dateInvited } }`.

---

### b. GET /api/coop-admin/cooperatives/:cooperativeId/managers

List all Managers of a Cooperative.

- Auth: `CoopManagersRead` or higher.
- Query params: `?page&pageSize&role`.
- Join `ManagementUsersCoperatives` with `ManagementUsers` where `CoperativeId = cooperativeId`, `DateDeleted IS NULL`.
- Return paginated list: `{ data: [{ id, fullName, email, role, isActive, isDefault, dateInvited, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

### c. GET /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId

Get a single Manager's details within a cooperative.

- Auth: `CoopManagersRead` or higher.
- Return: `{ id, fullName, email, role, isActive, isDefault, dateInvited, permissions: [] }`.
  - `permissions` populated from `ManagementUserPermissions` for `Support` role, filtered by `CoperativeId`.

---

### d. PATCH /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId/permissions

Update permissions for a `Support` role manager within this cooperative.

- Auth: `CoopManagersWrite` or higher.
- Cannot modify `RootManager` or `SuperManager` permissions. Return 400 `CANNOT_MODIFY_PERMISSIONS`.
- Receive DTO: `{ permissions: string[] }` — full replacement.
- Delete existing `ManagementUserPermissions` rows for `ManagerId + CoperativeId`. Insert new rows.
- Return: `{ id, fullName, email, role, permissions: [] }`.

---

### e. PATCH /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId/revoke

Revoke a Manager's access to this Cooperative.

- Auth: `CoopManagersWrite` or higher.
- Set `IsActive = 0` on the `ManagementUsers` row. `DateUpdated = now()`.
- Return: `{ success: true, message: "Manager access revoked" }`.

---

### f. PATCH /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId/transfer-root

Transfer `RooantManager` role to other manager within this cooperative.

- Auth: `RootAdmin` or `SuperAdmin` only.
- Receive DTO: `{ newRootManagerId }`.
- Validate `newRootManagerId` is a manager of this cooperative.
- Update current `RootManager` row in `ManagementUsersCoperatives` to `Role = "SuperManager"`.
- Update target manager's row to `Role = "RootManager"`.
- Return: `{ success: true, message: "RootManager transferred" }`.

---

---

### 5. Controller: Coop Members (per Cooperative)

Route prefix: `/api/coop-admin/cooperatives/:cooperativeId/members`
File: `coop-members.controller.ts`
Auth: All routes require valid admin JWT.

### Permission guards

- GET routes require `CoopMembersRead` or higher.
- POST/PUT/PATCH/DELETE routes require `CoopMembersWrite` or higher.

---

### a. POST /api/coop-admin/cooperatives/:cooperativeId/members/invite

Invite a Member to a Cooperative.

- Auth: `CoopMembersWrite` or higher.
- Validate `cooperativeId` exists and `DateDeleted IS NULL`. If not: return 404 `COOPERATIVE_NOT_FOUND`.
- Receive DTO: `{ firstName, lastName, email }`.
- `fullName` = `firstName + " " + lastName`.
- Check if `email` already exists in `MemberUsers`:
  - If exists: reuse that `MemberUsers` row (multi-tenancy).
  - If not exists: create new row in `MemberUsers`:
    - `Id` = UUID v4, `FullName`, `Email`
    - `Password` = bcrypt hash of `SecurePassword123`
    - `IsActive = 1`, `DefaultPasswordChanged = 0`
    - `DateInvited = now()`, `DateCreated = now()`
    - `InvitedByAdminId` = calling admin id, `InvitedByAdminType = "Admin"`
- Check if member is already in this cooperative (`MemberUsersCoperatives` where `MemberId + CoperativeId`). If so: return 409 `MEMBER_ALREADY_IN_COOPERATIVE`.
- Create row in `MemberUsersCoperatives`:
  - `Id` = UUID v4, `MemberId`, `CoperativeId`
  - `IsDefault = true` if this is the member's first cooperative, else `false`
  - `DateCreated = now()`
- **Wallet creation**: This is done by sending this action to a queue - MemberWallet Creation.
- The message gets to the queue and calls Embedly — create customer profile(and save to Embedly Customers table), then create wallet (and save to EmbedlyWallets table). Store wallet details (schemas in Database Schema.md file).
- Send invite email: subject `"You've been invited to join a Cooperative on Coop-op"`, body includes `fullName`, email, cooperative name, login link, default password and tell them a wallet will be created for them accordingly.
- Return: `{ member: { id, fullName, email, cooperativeId, isDefault, dateInvited } }`.

---

### b. GET /api/coop-admin/cooperatives/:cooperativeId/members

List all Members of a Cooperative.

- Auth: `CoopMembersRead` or higher.
- Query params: `?page&pageSize&search` (search on `FullName` or `Email`).
- Join `MemberUsersCoperatives` with `MemberUsers` where `CoperativeId = cooperativeId`, `DateDeleted IS NULL`.
- Return paginated list: `{ data: [{ id, fullName, email, isActive, isDefault, dateInvited, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

### c. GET /api/coop-admin/cooperatives/:cooperativeId/members/:memberId

Get a single Member's details within a cooperative.

- Auth: `CoopMembersRead` or higher.
- Return: `{ id, fullName, email, isActive, isDefault, dateInvited, dateCreated }`.

---

### d. PATCH /api/coop-admin/cooperatives/:cooperativeId/members/:memberId/revoke

Revoke a Member's access.

- Auth: `CoopMembersWrite` or higher.
- Set `IsActive = 0` on `MemberUsers`. `DateUpdated = now()`.
- Return: `{ success: true, message: "Member access revoked" }`.

---

---

## MANAGER PORTAL

---

### 6. Controller: Management Authentication

Route prefix: `/api/management`
File: `management-auth.controller.ts`

---

### a. POST /api/management/login

- Receive DTO: `{ email, password }`.
- Look up manager in `ManagementUsers` where `Email = email`, `IsActive = 1`, `DateDeleted IS NULL`.
- If not found or inactive: return 401 `INVALID_CREDENTIALS`.
- Compare `password` with bcrypt hash. If mismatch: return 401 `INVALID_CREDENTIALS`.
- Fetch all cooperatives this manager belongs to from `ManagementUsersCoperatives` (join `Cooperatives`) where `DateDeleted IS NULL`.
- Determine default cooperative: row where `IsDefault = true`.
- Generate JWT: `{ sub: id, type: "manager", email, defaultCooperativeId }`.
- Always include `requiresPasswordChange`: `true` if `DefaultPasswordChanged = 0`.
- Frontend redirects to `/manager/change-password` when `requiresPasswordChange = true`.
- Return: `{ token, requiresPasswordChange, manager: { id, fullName, email, isActive, defaultPasswordChanged, dateInvited }, cooperatives: [{ cooperativeId, cooperativeName, role, isDefault, permissions: [] }] }`.
  - `permissions` array is populated for `Support` role from `ManagementUserPermissions`, empty for `SuperManager`/`RootManager`.

---

### b. POST /api/management/request-otp

- Receive DTO: `{ email }`.
- Validate email exists in `ManagementUsers`, `IsActive = 1`, `DateDeleted IS NULL`.
- If not found: return 404 `MANAGER_NOT_FOUND`.
- Generate 6-digit OTP, store with 10-minute expiry.
- Send OTP email.
- Return: `{ success: true, message: "OTP sent to email" }`.

---

### c. POST /api/management/verify-otp-and-change-password

- Receive DTO: `{ email, otp, newPassword, confirmPassword }`.
- Validate `newPassword === confirmPassword`. If not: return 400 `PASSWORD_MISMATCH`.
- Validate OTP. If invalid/expired: return 400 `INVALID_OR_EXPIRED_OTP`.
- Hash new password, update `ManagementUsers`: `Password`, `DefaultPasswordChanged = 1`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Password changed successfully" }`.

---

### d. POST /api/management/switch-cooperative

Allows a manager to switch their active cooperative context.

- Auth: valid manager JWT.
- Receive DTO: `{ cooperativeId }`.
- Validate the calling manager belongs to `cooperativeId` via `ManagementUsersCoperatives`.
- If not found: return 403 `NOT_A_MANAGER_OF_THIS_COOPERATIVE`.
- Fetch that cooperative's role and permissions for this manager.
- Issue a new JWT with updated `defaultCooperativeId`.
- Return: `{ token, activeCooperative: { cooperativeId, cooperativeName, role, permissions: [] } }`.

---

---

### 7. Controller: Management — Manager Management

Route prefix: `/api/management/managers`
File: `management-managers.controller.ts`
Auth: All routes require valid manager JWT. Cooperative context comes from JWT `defaultCooperativeId`.

### Permission guards

- GET routes require `ManagementAdminRead` or `SuperManager`/`RootManager`.
- POST/PUT/PATCH/DELETE routes require `ManagementAdminWrite` or `SuperManager`/`RootManager`.
- `SuperManager` cannot revoke other `SuperManager`s — only `RootManager` can.

---

### a. POST /api/management/managers/invite

Invite another Manager to the same Cooperative.

- Auth: `ManagementAdminWrite` or `RootManager`/`SuperManager`.
- Cooperative context: `cooperativeId` from JWT `defaultCooperativeId`.
- Receive DTO: `{ fullName, email, role, permissions? }`.
  - `role` must be `SuperManager` or `Support`.
  - `permissions` required when `role = "Support"`.
- Same creation logic as `POST /api/coop-admin/cooperatives/:cooperativeId/managers/invite`.
- `InvitedByAdminType = "Manager"`, `InvitedByAdminId` = calling manager id.
- Return: `{ manager: { id, fullName, email, role, cooperativeId, dateInvited } }`.

---

### b. GET /api/management/managers

List all Managers of the active Cooperative.

- Auth: `ManagementAdminRead` or higher.
- Uses `cooperativeId` from JWT.
- Query params: `?page&pageSize&role`.
- Return paginated list: `{ data: [{ id, fullName, email, role, isActive, isDefault, dateInvited, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

### c. GET /api/management/managers/:managerId

Get a single Manager's details within the active cooperative.

- Auth: `ManagementAdminRead` or higher.
- Return: `{ id, fullName, email, role, isActive, isDefault, dateInvited, permissions: [] }`.

---

### d. PATCH /api/management/managers/:managerId/permissions

Update permissions for a `Support` role manager.

- Auth: `ManagementAdminWrite` or `RootManager`/`SuperManager`.
- Cannot modify `RootManager` or `SuperManager`. Return 400 `CANNOT_MODIFY_PERMISSIONS`.
- Receive DTO: `{ permissions: string[] }` — full replacement scoped to active `cooperativeId`.
- Return: `{ id, fullName, email, role, permissions: [] }`.

---

### e. PATCH /api/management/managers/:managerId/revoke

Revoke a Manager's access.

- Auth: `ManagementAdminWrite` or `RootManager`.
- `SuperManager` cannot revoke another `SuperManager`. Return 403 `INSUFFICIENT_PERMISSIONS`.
- Set `IsActive = 0` on `ManagementUsers`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Manager access revoked" }`.

---

---

### 8. Controller: Management — Member Management

Route prefix: `/api/management/members`
File: `management-members.controller.ts`
Auth: All routes require valid manager JWT. Cooperative context from JWT `defaultCooperativeId`.

### Permission guards

- GET routes require `ManagementMembersRead` or higher.
- POST/PUT/PATCH/DELETE routes require `ManagementMembersWrite` or higher.

---

### a. POST /api/management/members/invite

Invite a Member to the active Cooperative.

- Auth: `ManagementMembersWrite` or higher.
- Receive DTO: `{ firstName, lastName, email }`.
- Same creation logic as admin member invite. `InvitedByAdminType = "Manager"`.
- Wallet creation via Embedly on new `MemberUsersCoperatives` entry. Walle creation is via sending a message to a queue.
- Send invite email.
- Return: `{ member: { id, fullName, email, cooperativeId, isDefault, dateInvited } }`.

---

### b. GET /api/management/members

List all Members of the active Cooperative.

- Auth: `ManagementMembersRead` or higher.
- Query params: `?page&pageSize&search`.
- Return paginated list: `{ data: [{ id, fullName, email, isActive, isDefault, dateInvited, dateCreated }], page, pageSize, totalCount, totalPages }`.

---

### c. GET /api/management/members/:memberId

Get a single Member's details.

- Auth: `ManagementMembersRead` or higher.
- Return: `{ id, fullName, email, isActive, isDefault, dateInvited, dateCreated }`.

---

### d. PATCH /api/management/members/:memberId/revoke

Revoke a Member's access.

- Auth: `ManagementMembersWrite` or higher.
- Set `IsActive = 0` on `MemberUsers`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Member access revoked" }`.

---

---

## MEMBER PORTAL

---

### 9. Controller: Member Authentication

Route prefix: `/api/member`
File: `member-auth.controller.ts`

---

### a. POST /api/member/login

- Receive DTO: `{ email, password }`.
- Look up member in `MemberUsers` where `Email = email`, `IsActive = 1`, `DateDeleted IS NULL`.
- If not found or inactive: return 401 `INVALID_CREDENTIALS`.
- Compare `password` with bcrypt hash. If mismatch: return 401 `INVALID_CREDENTIALS`.
- Fetch all cooperatives this member belongs to from `MemberUsersCoperatives` (join `Cooperatives`) where `DateDeleted IS NULL`.
- Determine default cooperative: row where `IsDefault = true`.
- If member belongs to only one cooperative, that is automatically the active one.
- Generate JWT: `{ sub: id, type: "member", email, defaultCooperativeId }`.
- Always include `requiresPasswordChange`: `true` if `DefaultPasswordChanged = 0`.
- Frontend redirects to `/member/change-password` when `requiresPasswordChange = true`.
- Return: `{ token, requiresPasswordChange, member: { id, fullName, email, isActive, defaultPasswordChanged, dateInvited }, cooperatives: [{ cooperativeId, cooperativeName, isDefault }] }`.

---

### b. POST /api/member/request-otp

- Receive DTO: `{ email }`.
- Validate email exists in `MemberUsers`, `IsActive = 1`, `DateDeleted IS NULL`.
- If not found: return 404 `MEMBER_NOT_FOUND`.
- Generate 6-digit OTP, store with 10-minute expiry.
- Send OTP email.
- Return: `{ success: true, message: "OTP sent to email" }`.

---

### c. POST /api/member/verify-otp-and-change-password

- Receive DTO: `{ email, otp, newPassword, confirmPassword }`.
- Validate `newPassword === confirmPassword`. If not: return 400 `PASSWORD_MISMATCH`.
- Validate OTP. If invalid/expired: return 400 `INVALID_OR_EXPIRED_OTP`.
- Hash new password, update `MemberUsers`: `Password`, `DefaultPasswordChanged = 1`, `DateUpdated = now()`.
- Return: `{ success: true, message: "Password changed successfully" }`.

---

### d. POST /api/member/switch-cooperative

Allows a member to switch their active cooperative context.

- Auth: valid member JWT.
- Receive DTO: `{ cooperativeId }`.
- Validate member belongs to `cooperativeId` via `MemberUsersCoperatives`.
- If not found: return 403 `NOT_A_MEMBER_OF_THIS_COOPERATIVE`.
- Issue a new JWT with updated `defaultCooperativeId`.
- Return: `{ token, activeCooperative: { cooperativeId, cooperativeName } }`.

---

### e. GET /api/member/dashboard

Get member dashboard data for the active cooperative.

- Auth: valid member JWT.
- Uses `defaultCooperativeId` from JWT.
- Validate member still belongs to this cooperative and `IsActive = 1`.
- Return: `{ member: { id, fullName, email }, activeCooperative: { cooperativeId, cooperativeName }, cooperatives: [{ cooperativeId, cooperativeName, isDefault }] }`.

---

---

## Error Code Reference

| Code                                    | HTTP Status | Meaning                                          |
| --------------------------------------- | ----------- | ------------------------------------------------ |
| `INVALID_CREDENTIALS`                   | 401         | Wrong email or password                          |
| `INVALID_OR_EXPIRED_OTP`                | 400         | OTP wrong or past 10-minute window               |
| `PASSWORD_MISMATCH`                     | 400         | newPassword !== confirmPassword                  |
| `ADMIN_NOT_FOUND`                       | 404         | No matching admin                                |
| `MANAGER_NOT_FOUND`                     | 404         | No matching manager                              |
| `MEMBER_NOT_FOUND`                      | 404         | No matching member                               |
| `COOPERATIVE_NOT_FOUND`                 | 404         | No matching cooperative                          |
| `EMAIL_ALREADY_EXISTS`                  | 409         | Email already registered                         |
| `ROOT_MANAGER_ALREADY_EXISTS`           | 409         | Cooperative already has a RootManager            |
| `MEMBER_ALREADY_IN_COOPERATIVE`         | 409         | Member is already part of this cooperative       |
| `CANNOT_MODIFY_PERMISSIONS`             | 400         | Target role has implicit full access             |
| `CANNOT_MODIFY_SUPER_ADMIN_PERMISSIONS` | 400         | SuperAdmins have implicit full access            |
| `INSUFFICIENT_PERMISSIONS`              | 403         | Caller lacks the required role or permission key |
| `NOT_A_MANAGER_OF_THIS_COOPERATIVE`     | 403         | Manager does not belong to requested cooperative |
| `NOT_A_MEMBER_OF_THIS_COOPERATIVE`      | 403         | Member does not belong to requested cooperative  |
| `UNAUTHORIZED`                          | 401         | Missing or invalid JWT                           |
