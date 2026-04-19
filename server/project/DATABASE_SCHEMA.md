# Tables to use

## Table List

### 1. AdminUsers

```
Id                      CHAR(36)      NOT NULL PRIMARY KEY
FullName                VARCHAR(255)  NOT NULL
Email                   VARCHAR(255)  NOT NULL UNIQUE
Password                VARCHAR(255)  NOT NULL  -- bcrypt hashed (10 rounds)
Role                    ENUM('RootAdmin', 'SuperAdmin', 'Admin') NOT NULL
IsActive                TINYINT(1)    NOT NULL DEFAULT 1   -- 0 = access revoked
DefaultPasswordChanged  TINYINT(1)    NOT NULL DEFAULT 0   -- must change on first login
DateInvited             TIMESTAMP(6)  NOT NULL             -- when invite was sent (= DateCreated for RootAdmin)
InvitedByAdminId        CHAR(36)      NULL                 -- FK → AdminUsers. NULL only for RootAdmin (seeded directly)
DateCreated             TIMESTAMP(6)  NOT NULL
DateUpdated             TIMESTAMP(6)  NULL
DateDeleted             TIMESTAMP(6)  NULL

FOREIGN KEY (InvitedByAdminId) REFERENCES AdminUsers(Id)
```

### 2. AdminPermissions

Granular permission assignments for Coop-ops Admins with `Role = 'Admin'`. SuperAdmins and RootAdmin implicitly have all permissions — they do NOT need rows in this table.

```
Id              CHAR(36)      NOT NULL PRIMARY KEY
AdminId         CHAR(36)      NOT NULL    -- FK → AdminUsers
PermissionKey   VARCHAR(100)  NOT NULL    -- one of the valid keys listed below
DateCreated     TIMESTAMP(6)  NOT NULL
DateUpdated     TIMESTAMP(6)  NULL
DateDeleted     TIMESTAMP(6)  NULL

FOREIGN KEY (AdminId) REFERENCES ### AdminUsers(Id)
UNIQUE KEY uq_admin_permission (AdminId, PermissionKey)   -- no duplicate grants

Each controller will generates two permission levels: READ (GET endpoints) and WRITE (POST/PUT/PATCH/DELETE endpoints).
```

### 4. ManagementUsers

```
Id                      CHAR(36)      NOT NULL PRIMARY KEY
FullName                VARCHAR(255)  NOT NULL
Email                   VARCHAR(255)  NOT NULL UNIQUE
Password                VARCHAR(255)  NOT NULL  -- bcrypt hashed (10 rounds)
IsActive                TINYINT(1)    NOT NULL DEFAULT 1   -- 0 = access revoked
DefaultPasswordChanged  TINYINT(1)    NOT NULL DEFAULT 0   -- must change on first login
DateInvited             TIMESTAMP(6)  NOT NULL
InvitedByAdminId        CHAR(36)      NOT NULL                 -- FK → AdminUsers or ManagementUsers.
InvitedByAdminType      CHAR(36)      NOT NULL
DateCreated             TIMESTAMP(6)  NOT NULL
DateUpdated             TIMESTAMP(6)  NULL
DateDeleted             TIMESTAMP(6)  NULL

FOREIGN KEY (InvitedByAdminId) REFERENCES AdminUsers(Id)
```

#### 5. ManagementUsersCoperatives

```
Id                      CHAR(36)      NOT NULL PRIMARY KEY
ManagerId               CHAR(36)      NOT NULL    -- FK → ManagementUsers
CoperativeId            CHAR(36)      NOT NULL    -- FK → Coperatives
Role                    ENUM('RootManager', 'SuperManager', 'Support') NOT NULL
IsDefault               boolean        NOT NULL    -- used to determine the default coperative body of a manager.
DateCreated             TIMESTAMP(6)  NOT NULL
DateUpdated             TIMESTAMP(6)  NULL
DateDeleted             TIMESTAMP(6)  NULL

FOREIGN KEY (ManagerId) REFERENCES ManagementUsers(Id)
UNIQUE KEY uq_rootManager_role (ManagerId, CoperativeId, Role)   -- no duplicate RootManager Role for 1 cooperative.I might have written the unique key wrongly.
```

### 6. ManagementUserPermissions

```
Id              CHAR(36)      NOT NULL PRIMARY KEY
ManagerId       CHAR(36)      NOT NULL    -- FK → ManagementUsers
CoperativeId    CHAR(36)      NOT NULL    -- FK → Coperatives
PermissionKey   VARCHAR(100)  NOT NULL    -- one of the valid keys listed below
DateCreated     TIMESTAMP(6)  NOT NULL
DateUpdated     TIMESTAMP(6)  NULL
DateDeleted     TIMESTAMP(6)  NULL

FOREIGN KEY (ManagerId) REFERENCES ManagementUsers(Id)
UNIQUE KEY uq_admin_permission (ManagerId, PermissionKey, CoperativeId)   -- no duplicate grants

Each controller will generates two permission levels: READ (GET endpoints) and WRITE (POST/PUT/PATCH/DELETE endpoints).
```

#### 7. Coperatives

```
Id                      CHAR(36)      NOT NULL PRIMARY KEY
Name
--other details will be added later
CreatedByAdminId        CHAR(36)      NOT NULL                 -- FK → AdminUsers or ManagementUsers.
CreatedByAdminType      CHAR(36)      NOT NULL                 -- either Admin or Manager
DateCreated             TIMESTAMP(6)  NOT NULL
DateUpdated             TIMESTAMP(6)  NULL
DateDeleted             TIMESTAMP(6)  NULL
```

#### 7. CoperativesProperties

```
  "Id" char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  "CoperativeId" char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  "Key" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "Value" longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  "GroupName" longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  "IsActive" tinyint(1) NOT NULL,
  "DateCreated" datetime(6) NOT NULL,
  "DateUpdated" datetime(6) DEFAULT NULL,
  "DateDeleted" datetime(6) DEFAULT NULL,
  "CreatedBy" char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  "UpdatedBy" bigint DEFAULT NULL,
  "DeletedBy" bigint DEFAULT NULL,
  PRIMARY KEY ("Id"),
  UNIQUE KEY "ix_CoperativesProperty_CoperativeId_Key" ("CoperativeId","Key"),
  KEY "ix_CoperativesProperty_CoperativeId" ("CoperativeId"),
  KEY "ix_CoperativesProperty_Datedeleted" ("DateDeleted"),
  KEY "ix_CoperativesProperty_GroupName" ("CoperativeId")
```

#### 8. MemberUsers

```
Id                      CHAR(36)      NOT NULL PRIMARY KEY
FullName                VARCHAR(255)  NOT NULL
Email                   VARCHAR(255)  NOT NULL UNIQUE
Password                VARCHAR(255)  NOT NULL  -- bcrypt hashed (10 rounds)
IsActive                TINYINT(1)    NOT NULL DEFAULT 1   -- 0 = access revoked
DefaultPasswordChanged  TINYINT(1)    NOT NULL DEFAULT 0   -- must change on first login
DateInvited             TIMESTAMP(6)  NOT NULL
InvitedByAdminId        CHAR(36)      NOT NULL                 -- FK → AdminUsers or ManagementUsers.
InvitedByAdminType      CHAR(36)      NOT NULL
DateCreated             TIMESTAMP(6)  NOT NULL
DateUpdated             TIMESTAMP(6)  NULL
DateDeleted             TIMESTAMP(6)  NULL

FOREIGN KEY (InvitedByAdminId, ManagementUsers) REFERENCES AdminUsers(Id)
```

#### 9. MemberUsersCoperatives

```
Id                      CHAR(36)      NOT NULL PRIMARY KEY
MemberId                CHAR(36)      NOT NULL    -- FK → MemberUsers
CoperativeId            CHAR(36)      NOT NULL    -- FK → Coperatives
IsDefault               boolean        NOT NULL    -- used to determine the default coperative body of a member.
DateCreated             TIMESTAMP(6)  NOT NULL
DateUpdated             TIMESTAMP(6)  NULL
DateDeleted             TIMESTAMP(6)  NULL

FOREIGN KEY (MemberId) REFERENCES MemberUsers(Id)
```

#### 10. EmbedlyRequestResponseLogs

```
    Id
    ApiUrl //string
    Method (GET/POST/PUT/PATCH/DELETE)
    RequestPayload (this is nullable as not all requests have request body)
    ResponsePayload (this is also nullable)
    ResponseStatusCode 200, 400,401, etc
    DateCreated
```

#### 11. EmbedlyCustomers

```
    Id
    CustomerType (Cooperative or Member)
    OwnerId //the cooperaticeId or MemberId
    CooperativeId //if it's a member, then add the corresponding coperative, for cooperative, you can jsut repeat the copreativeId again here
    FirstName //this is what we send to Embedly
    LastName //this is what we send to Embedly
    CustomerId //this is the Id coming from the wallet provider
    DateCreated
    DateUpdated
```

#### 12. EmbedlyWallets

```
    Id
    WalletType (Cooperative, Member) //either owned by cooperative or member. can't be both and can't be null
    OwnerId (cooperaticeId or MemberId on coop op)
    CooperativeId //if it's a member, then add the corresponding coperative, for cooperative, you can jsut repeat the copreativeId again here
    CustomerId //this is the customerId sent to Embedly for wallet creation (so it's from embedly)
    AccountNumber //this is coming from the wallet provider
    WalletId //this is coming from the wallet provider
    isLocalRestricted -> wallet is restricted by Admin
    restrictedBy (AdminUserId) //links the wallet to the AdminUser who restricted it
    DateCreated
    DateUpdated
```

## Tables Cardinality

## Tables Relationship

## General Rules

1. All Ids are GUIDs (CHAR(36)), generated with UUID v4.
2. All Emails/PhoneNumbers are unique on all tables.
3. All tables have DateCreated TIMESTAMP(6), DateUpdated TIMESTAMP(6) NULL, DateDeleted TIMESTAMP(6) NULL — except append-only tables which only have DateCreated.
4. DateUpdated defaults to null on creation.
5. Soft deletes: always check `DateDeleted IS NULL` in SELECT queries.
6. PascalCase for all table names and column names.
7. Migrations are plain JavaScript (not TypeScript) in `/server/migrations/`, numbered sequentially.

```

```
