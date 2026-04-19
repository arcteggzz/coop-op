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
    CREATE TABLE IF NOT EXISTS ManagementUserPermissions (
      Id            CHAR(36)      NOT NULL,
      ManagerId     CHAR(36)      NOT NULL,
      CooperativeId CHAR(36)      NOT NULL,
      PermissionKey VARCHAR(100)  NOT NULL,
      DateCreated   TIMESTAMP(6)  NOT NULL,
      DateUpdated   TIMESTAMP(6)  NULL,
      DateDeleted   TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id),
      UNIQUE KEY uq_manager_permission (ManagerId, PermissionKey, CooperativeId),
      FOREIGN KEY (ManagerId) REFERENCES ManagementUsers(Id),
      FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS ManagementUserPermissions;", callback);
};

exports._meta = {
  version: 1,
};
