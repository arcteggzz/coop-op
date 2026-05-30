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
    CREATE TABLE IF NOT EXISTS LevyAssignments (
      Id                CHAR(36)       NOT NULL,
      LevyId            CHAR(36)       NOT NULL,
      MemberId          CHAR(36)       NOT NULL,
      CooperativeId     CHAR(36)       NOT NULL,
      Amount            DECIMAL(15,2)  NOT NULL,
      LevyAccountNumber VARCHAR(50)    NULL,
      Status            ENUM('Pending','Paid','Waived') NOT NULL DEFAULT 'Pending',
      PaidDate          TIMESTAMP(6)   NULL,
      PaidAmount        DECIMAL(15,2)  NULL,
      Notes             TEXT           NULL,
      RecordedById      CHAR(36)       NULL,
      RecordedByType    VARCHAR(20)    NULL,
      DateCreated       TIMESTAMP(6)   NOT NULL,
      DateUpdated       TIMESTAMP(6)   NULL,
      PRIMARY KEY (Id),
      UNIQUE KEY uq_levy_assignment (LevyId, MemberId),
      KEY ix_LevyAssignments_LevyId (LevyId),
      KEY ix_LevyAssignments_MemberId (MemberId),
      KEY ix_LevyAssignments_CooperativeId (CooperativeId),
      CONSTRAINT fk_LevyAssignments_LevyId FOREIGN KEY (LevyId) REFERENCES Levies (Id),
      CONSTRAINT fk_LevyAssignments_MemberId FOREIGN KEY (MemberId) REFERENCES MemberUsers (Id),
      CONSTRAINT fk_LevyAssignments_CooperativeId FOREIGN KEY (CooperativeId) REFERENCES Cooperatives (Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS LevyAssignments;", callback);
};

exports._meta = {
  version: 1,
};
