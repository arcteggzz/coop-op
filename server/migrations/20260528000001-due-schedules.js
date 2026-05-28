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
    CREATE TABLE IF NOT EXISTS DueSchedules (
      Id               CHAR(36)      NOT NULL,
      CooperativeId    CHAR(36)      NOT NULL,
      Name             VARCHAR(255)  NOT NULL,
      Description      TEXT          NULL,
      Amount           DECIMAL(15,2) NOT NULL,
      Frequency        ENUM('Monthly','Quarterly','Biannual','Annual','OneTime') NOT NULL,
      StartDate        DATE          NOT NULL,
      EndDate          DATE          NULL,
      DueAccountNumber VARCHAR(50)   NOT NULL,
      IsActive         TINYINT(1)    NOT NULL DEFAULT 1,
      CreatedById      CHAR(36)      NOT NULL,
      CreatedByType    VARCHAR(20)   NOT NULL,
      DateCreated      TIMESTAMP(6)  NOT NULL,
      DateUpdated      TIMESTAMP(6)  NULL,
      DateDeleted      TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id),
      KEY ix_DueSchedules_CooperativeId (CooperativeId),
      KEY ix_DueSchedules_DueAccountNumber (DueAccountNumber),
      CONSTRAINT fk_DueSchedules_CooperativeId FOREIGN KEY (CooperativeId) REFERENCES Cooperatives (Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS DueSchedules;", callback);
};

exports._meta = {
  version: 1,
};
