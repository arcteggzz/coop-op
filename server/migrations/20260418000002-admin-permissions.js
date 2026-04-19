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
    CREATE TABLE IF NOT EXISTS AdminPermissions (
      Id            CHAR(36)      NOT NULL,
      AdminId       CHAR(36)      NOT NULL,
      PermissionKey VARCHAR(100)  NOT NULL,
      DateCreated   TIMESTAMP(6)  NOT NULL,
      DateUpdated   TIMESTAMP(6)  NULL,
      DateDeleted   TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id),
      UNIQUE KEY uq_admin_permission (AdminId, PermissionKey),
      CONSTRAINT fk_adminperm_admin FOREIGN KEY (AdminId) REFERENCES AdminUsers(Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS AdminPermissions;", callback);
};

exports._meta = {
  version: 1,
};
