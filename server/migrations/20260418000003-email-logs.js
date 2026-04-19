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
    CREATE TABLE IF NOT EXISTS EmailsLogs (
      Id             CHAR(36)     NOT NULL,
      RecipientEmail VARCHAR(255) NOT NULL,
      SenderEmail    VARCHAR(255) NOT NULL,
      Subject        VARCHAR(255) NOT NULL,
      SentAt         TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      Template       VARCHAR(100) NOT NULL,
      ReferenceId    CHAR(36)     DEFAULT NULL,
      IsSent         TINYINT(1)   NOT NULL DEFAULT 0,
      PRIMARY KEY (Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS EmailsLogs;", callback);
};

exports._meta = {
  version: 1,
};
