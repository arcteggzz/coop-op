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
    CREATE TABLE IF NOT EXISTS EmbedlyRequestResponseLogs (
      Id                  CHAR(36)        NOT NULL,
      ApiUrl              VARCHAR(2048)   NOT NULL,
      Method              VARCHAR(10)     NOT NULL,
      RequestPayload      LONGTEXT        NULL,
      ResponsePayload     LONGTEXT        NULL,
      ResponseStatusCode  INT             NULL,
      DateCreated         TIMESTAMP(6)    NOT NULL,
      PRIMARY KEY (Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS EmbedlyRequestResponseLogs;", callback);
};

exports._meta = {
  version: 1,
};
