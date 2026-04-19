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
    CREATE TABLE IF NOT EXISTS MemberUsersCooperatives (
      Id            CHAR(36)      NOT NULL,
      MemberId      CHAR(36)      NOT NULL,
      CooperativeId CHAR(36)      NOT NULL,
      IsDefault     TINYINT(1)    NOT NULL DEFAULT 0,
      DateCreated   TIMESTAMP(6)  NOT NULL,
      DateUpdated   TIMESTAMP(6)  NULL,
      DateDeleted   TIMESTAMP(6)  NULL,
      PRIMARY KEY (Id),
      KEY ix_MemberUsersCooperatives_MemberId (MemberId),
      KEY ix_MemberUsersCooperatives_CooperativeId (CooperativeId),
      FOREIGN KEY (MemberId) REFERENCES MemberUsers(Id),
      FOREIGN KEY (CooperativeId) REFERENCES Cooperatives(Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql("DROP TABLE IF EXISTS MemberUsersCooperatives;", callback);
};

exports._meta = {
  version: 1,
};
