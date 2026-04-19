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
    CREATE TABLE IF NOT EXISTS EmbedlyCustomers (
      Id            CHAR(36)      NOT NULL,
      CustomerType  VARCHAR(50)   NOT NULL,
      OwnerId       CHAR(36)      NOT NULL,
      CooperativeId CHAR(36)      NOT NULL,
      FirstName     VARCHAR(255)  NOT NULL,
      LastName      VARCHAR(255)  NOT NULL,
      CustomerId    VARCHAR(255)  NOT NULL,
      DateCreated   TIMESTAMP(6)  NOT NULL,
      DateUpdated   TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id),
      KEY ix_EmbedlyCustomers_OwnerId (OwnerId),
      KEY ix_EmbedlyCustomers_CooperativeId (CooperativeId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS EmbedlyCustomers;", callback);
};

exports._meta = {
  version: 1,
};
