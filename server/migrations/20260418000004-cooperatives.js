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
    CREATE TABLE IF NOT EXISTS Cooperatives (
      Id                  CHAR(36)      NOT NULL,
      Name                VARCHAR(255)  NOT NULL,
      CreatedByAdminId    CHAR(36)      NOT NULL,
      CreatedByAdminType  VARCHAR(50)   NOT NULL,
      DateCreated         TIMESTAMP(6)  NOT NULL,
      DateUpdated         TIMESTAMP(6)  NULL,
      DateDeleted         TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS Cooperatives;", callback);
};

exports._meta = {
  version: 1,
};
