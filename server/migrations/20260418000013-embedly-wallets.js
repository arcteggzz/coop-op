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
    CREATE TABLE IF NOT EXISTS EmbedlyWallets (
      Id                  CHAR(36)      NOT NULL,
      WalletType          VARCHAR(50)   NOT NULL,
      OwnerId             CHAR(36)      NOT NULL,
      CooperativeId       CHAR(36)      NOT NULL,
      CustomerId          VARCHAR(255)  NOT NULL,
      AccountNumber       VARCHAR(50)   NOT NULL,
      WalletId            VARCHAR(255)  NOT NULL,
      IsLocalRestricted   TINYINT(1)    NOT NULL DEFAULT 0,
      RestrictedBy        CHAR(36)      NULL,
      DateCreated         TIMESTAMP(6)  NOT NULL,
      DateUpdated         TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id),
      KEY ix_EmbedlyWallets_OwnerId (OwnerId),
      KEY ix_EmbedlyWallets_CooperativeId (CooperativeId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS EmbedlyWallets;", callback);
};

exports._meta = {
  version: 1,
};
