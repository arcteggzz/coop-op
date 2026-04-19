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
    CREATE TABLE IF NOT EXISTS CooperativesProperties (
      Id            CHAR(36)      NOT NULL,
      CooperativeId CHAR(36)      NOT NULL,
      \`Key\`         VARCHAR(255)  NULL,
      Value         LONGTEXT      NULL,
      GroupName     LONGTEXT      NULL,
      IsActive      TINYINT(1)    NOT NULL DEFAULT 1,
      CreatedBy     CHAR(36)      NOT NULL,
      UpdatedBy     CHAR(36)      NULL,
      DeletedBy     CHAR(36)      NULL,
      DateCreated   DATETIME(6)   NOT NULL,
      DateUpdated   DATETIME(6)   NULL,
      DateDeleted   DATETIME(6)   NULL,
      PRIMARY KEY (Id),
      UNIQUE KEY ix_CooperativesProperty_CooperativeId_Key (CooperativeId, \`Key\`),
      KEY ix_CooperativesProperty_CooperativeId (CooperativeId),
      KEY ix_CooperativesProperty_DateDeleted (DateDeleted),
      FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS CooperativesProperties;", callback);
};

exports._meta = {
  version: 1,
};
