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
    CREATE TABLE IF NOT EXISTS AdminUsers (
      Id                     CHAR(36)       NOT NULL,
      FullName               VARCHAR(255)   NOT NULL,
      Email                  VARCHAR(255)   NOT NULL,
      Password               VARCHAR(255)   NOT NULL,
      Role                   ENUM('RootAdmin', 'SuperAdmin', 'Admin') NOT NULL,
      IsActive               TINYINT(1)     NOT NULL DEFAULT 1,
      DefaultPasswordChanged TINYINT(1)     NOT NULL DEFAULT 0,
      DateInvited            TIMESTAMP(6)   NOT NULL,
      InvitedByAdminId       CHAR(36)       NULL,
      DateCreated            TIMESTAMP(6)   NOT NULL,
      DateUpdated            TIMESTAMP(6)   NULL,
      DateDeleted            TIMESTAMP(6)   NULL,
      PRIMARY KEY (Id),
      UNIQUE KEY uq_admin_email (Email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS AdminUsers;", callback);
};

exports._meta = {
  version: 1,
};
