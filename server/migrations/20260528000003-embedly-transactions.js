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
    `CREATE TABLE EmbedlyTransactions (
      Id                   CHAR(36)      NOT NULL PRIMARY KEY,
      SenderWalletAccount  VARCHAR(50)   NOT NULL,
      ReceiverAccount      VARCHAR(50)   NOT NULL,
      Amount               DECIMAL(15,2) NOT NULL,
      TransactionReference VARCHAR(100)  NOT NULL,
      IsSuccessful         TINYINT(1)    NOT NULL DEFAULT 0,
      TransactionType      VARCHAR(50)   NOT NULL,
      DateCreated          TIMESTAMP(6)  NOT NULL,
      DateUpdated          TIMESTAMP(6)  NULL,
      DateDeleted          TIMESTAMP(6)  NULL
    )`,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS EmbedlyTransactions", callback);
};

exports._meta = {
  version: 1,
};
