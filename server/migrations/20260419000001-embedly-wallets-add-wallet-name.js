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
    `ALTER TABLE EmbedlyWallets ADD COLUMN WalletName VARCHAR(255) NULL AFTER WalletId;`,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `ALTER TABLE EmbedlyWallets DROP COLUMN WalletName;`,
    callback,
  );
};

exports._meta = {
  version: 1,
};
