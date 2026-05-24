# V02 Database Schema — Dues, Levies, Savings

> Follows all general rules from DATABASE_SCHEMA.md: UUIDs (CHAR(36)), PascalCase, soft deletes, TIMESTAMP(6).

---

## DUES

### 13. DueSchedules

The recurring dues plan configured per cooperative.

```
Id                CHAR(36)       NOT NULL PRIMARY KEY
CooperativeId     CHAR(36)       NOT NULL   -- FK → Cooperatives
Name              VARCHAR(255)   NOT NULL   -- e.g. "Monthly Dues 2026"
Description       TEXT           NULL
Amount            DECIMAL(15,2)  NOT NULL   -- base amount per member per period
Frequency         ENUM('Monthly','Quarterly','Biannual','Annual','OneTime')  NOT NULL
StartDate         DATE           NOT NULL
EndDate           DATE           NULL       -- null = open-ended
IsActive          TINYINT(1)     NOT NULL DEFAULT 1
CreatedById       CHAR(36)       NOT NULL   -- FK → AdminUsers or ManagementUsers
CreatedByType     VARCHAR(20)    NOT NULL   -- 'Admin' | 'Manager'
DateCreated       TIMESTAMP(6)   NOT NULL
DateUpdated       TIMESTAMP(6)   NULL
DateDeleted       TIMESTAMP(6)   NULL

FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
```

### 14. DuePayments

Per-member per-period dues record. Created in bulk when a manager issues dues for a period.

```
Id                CHAR(36)       NOT NULL PRIMARY KEY
DueScheduleId     CHAR(36)       NOT NULL   -- FK → DueSchedules
MemberId          CHAR(36)       NOT NULL   -- FK → MemberUsers
CooperativeId     CHAR(36)       NOT NULL   -- FK → Cooperatives (denormalized for query convenience)
PeriodLabel       VARCHAR(50)    NOT NULL   -- e.g. "April 2026"
DueDate           DATE           NOT NULL
Amount            DECIMAL(15,2)  NOT NULL   -- snapshot of amount at issuance time
Status            ENUM('Pending','Paid','Waived','Overdue')  NOT NULL DEFAULT 'Pending'
PaidDate          TIMESTAMP(6)   NULL
PaidAmount        DECIMAL(15,2)  NULL
Notes             TEXT           NULL
RecordedById      CHAR(36)       NULL       -- who recorded payment/waiver
RecordedByType    VARCHAR(20)    NULL       -- 'Admin' | 'Manager' | 'Member'
DateCreated       TIMESTAMP(6)   NOT NULL
DateUpdated       TIMESTAMP(6)   NULL

FOREIGN KEY (DueScheduleId) REFERENCES DueSchedules(Id)
FOREIGN KEY (MemberId) REFERENCES MemberUsers(Id)
FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
UNIQUE KEY uq_due_payment (DueScheduleId, MemberId, PeriodLabel)  -- one record per member per period
```

---

## LEVIES

### 15. Levies

A one-time or ad-hoc charge created for a cooperative.

```
Id                CHAR(36)       NOT NULL PRIMARY KEY
CooperativeId     CHAR(36)       NOT NULL   -- FK → Cooperatives
Name              VARCHAR(255)   NOT NULL   -- e.g. "Absenteeism Fine — March AGM"
Description       TEXT           NULL
DefaultAmount     DECIMAL(15,2)  NOT NULL   -- default charge per member (can be overridden per assignment)
DueDate           DATE           NOT NULL
IsActive          TINYINT(1)     NOT NULL DEFAULT 1
CreatedById       CHAR(36)       NOT NULL
CreatedByType     VARCHAR(20)    NOT NULL   -- 'Admin' | 'Manager'
DateCreated       TIMESTAMP(6)   NOT NULL
DateUpdated       TIMESTAMP(6)   NULL
DateDeleted       TIMESTAMP(6)   NULL

FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
```

### 16. LevyAssignments

Per-member assignment of a levy. Created when a manager assigns the levy (to all or specific members).

```
Id                CHAR(36)       NOT NULL PRIMARY KEY
LevyId            CHAR(36)       NOT NULL   -- FK → Levies
MemberId          CHAR(36)       NOT NULL   -- FK → MemberUsers
CooperativeId     CHAR(36)       NOT NULL   -- FK → Cooperatives (denormalized)
Amount            DECIMAL(15,2)  NOT NULL   -- can differ from Levies.DefaultAmount
Status            ENUM('Pending','Paid','Waived')  NOT NULL DEFAULT 'Pending'
PaidDate          TIMESTAMP(6)   NULL
PaidAmount        DECIMAL(15,2)  NULL
Notes             TEXT           NULL
RecordedById      CHAR(36)       NULL
RecordedByType    VARCHAR(20)    NULL       -- 'Admin' | 'Manager' | 'Member'
DateCreated       TIMESTAMP(6)   NOT NULL
DateUpdated       TIMESTAMP(6)   NULL

FOREIGN KEY (LevyId) REFERENCES Levies(Id)
FOREIGN KEY (MemberId) REFERENCES MemberUsers(Id)
FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
UNIQUE KEY uq_levy_assignment (LevyId, MemberId)   -- one assignment per member per levy
```

---

## SAVINGS

Savings plans are **member-owned**. Each member creates their own savings plans within a cooperative context. Admins and managers can view and act on them but do not create the plan templates.

### 17. SavingsPlans

A member's personal savings plan, scoped to a cooperative.

```
Id                  CHAR(36)       NOT NULL PRIMARY KEY
MemberId            CHAR(36)       NOT NULL   -- FK → MemberUsers (the plan owner)
CooperativeId       CHAR(36)       NOT NULL   -- FK → Cooperatives
Name                VARCHAR(255)   NOT NULL   -- e.g. "House Rent Fund 2026"
Description         TEXT           NULL
TargetAmount        DECIMAL(15,2)  NULL       -- optional savings goal; null = open-ended
ContributionAmount  DECIMAL(15,2)  NULL       -- optional expected deposit per cycle
Frequency           ENUM('Daily','Weekly','Monthly','Quarterly','Annual')  NULL
CurrentBalance      DECIMAL(15,2)  NOT NULL DEFAULT 0.00
Status              ENUM('Active','Paused','Closed')  NOT NULL DEFAULT 'Active'
CreatedById         CHAR(36)       NOT NULL   -- MemberId, or admin/manager who helped
CreatedByType       VARCHAR(20)    NOT NULL   -- 'Member' | 'Admin' | 'Manager'
DateCreated         TIMESTAMP(6)   NOT NULL
DateUpdated         TIMESTAMP(6)   NULL
DateDeleted         TIMESTAMP(6)   NULL

FOREIGN KEY (MemberId) REFERENCES MemberUsers(Id)
FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
```

### 18. SavingsTransactions

Append-only ledger of all deposits and withdrawals against a savings plan.

```
Id                CHAR(36)       NOT NULL PRIMARY KEY
SavingsPlanId     CHAR(36)       NOT NULL   -- FK → SavingsPlans
MemberId          CHAR(36)       NOT NULL   -- FK → MemberUsers (denormalized)
CooperativeId     CHAR(36)       NOT NULL   -- FK → Cooperatives (denormalized)
Amount            DECIMAL(15,2)  NOT NULL
Type              ENUM('Deposit','Withdrawal')  NOT NULL
Reference         VARCHAR(100)   NULL       -- payment reference or transaction ID
Notes             TEXT           NULL
RecordedById      CHAR(36)       NOT NULL
RecordedByType    VARCHAR(20)    NOT NULL   -- 'Admin' | 'Manager' | 'Member'
DateCreated       TIMESTAMP(6)   NOT NULL   -- append-only: no DateUpdated/DateDeleted

FOREIGN KEY (SavingsPlanId) REFERENCES SavingsPlans(Id)
FOREIGN KEY (MemberId) REFERENCES MemberUsers(Id)
FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
```

---

## Tables Cardinality Summary

- Cooperative → DueSchedules: 1-to-many
- DueSchedule → DuePayments: 1-to-many
- MemberUser → DuePayments: 1-to-many
- Cooperative → Levies: 1-to-many
- Levy → LevyAssignments: 1-to-many
- MemberUser → LevyAssignments: 1-to-many
- MemberUser → SavingsPlans: 1-to-many
- Cooperative → SavingsPlans: 1-to-many
- SavingsPlan → SavingsTransactions: 1-to-many
