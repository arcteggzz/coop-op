"use strict";

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.runSql(
    `
    CREATE TABLE IF NOT EXISTS DuePayments (
      Id                  CHAR(36)      NOT NULL,
      DueScheduleId       CHAR(36)      NOT NULL,
      MemberId            CHAR(36)      NOT NULL,
      CooperativeId       CHAR(36)      NOT NULL,
      PeriodLabel         VARCHAR(50)   NOT NULL,
      DueDate             DATE          NOT NULL,
      Amount              DECIMAL(15,2) NOT NULL,
      DueAccountNumber    VARCHAR(50)   NULL,
      MemberAccountNumber VARCHAR(50)   NULL,
      Status              ENUM('Pending','Paid','Waived','Overdue') NOT NULL DEFAULT 'Pending',
      PaidDate            TIMESTAMP(6)  NULL,
      PaidAmount          DECIMAL(15,2) NULL,
      Notes               TEXT          NULL,
      RecordedById        CHAR(36)      NULL,
      RecordedByType      VARCHAR(20)   NULL,
      DateCreated         TIMESTAMP(6)  NOT NULL,
      DateUpdated         TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id),
      UNIQUE KEY uq_due_payment (DueScheduleId, MemberId, PeriodLabel),
      KEY ix_DuePayments_MemberId (MemberId),
      KEY ix_DuePayments_CooperativeId (CooperativeId),
      KEY ix_DuePayments_Status (Status),
      CONSTRAINT fk_DuePayments_DueScheduleId FOREIGN KEY (DueScheduleId) REFERENCES DueSchedules (Id),
      CONSTRAINT fk_DuePayments_MemberId FOREIGN KEY (MemberId) REFERENCES MemberUsers (Id),
      CONSTRAINT fk_DuePayments_CooperativeId FOREIGN KEY (CooperativeId) REFERENCES Cooperatives (Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS DuePayments;", callback);
};

exports._meta = {
  version: 1,
};
