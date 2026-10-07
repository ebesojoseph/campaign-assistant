import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { DataTypes, Model } = require("sequelize");

import { ROLES, enumValues } from "../constants/index.js";

export default (sequelize) => {
  class User extends Model {}
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(v) {
          this.setDataValue("email", String(v).trim().toLowerCase());
        },
      },
      passwordHash: { type: DataTypes.STRING(100), allowNull: false },
      role: {
        type: DataTypes.ENUM(...enumValues(ROLES)),
        allowNull: false,
        defaultValue: ROLES.MARKETER,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      // The hash never leaves the DB layer unless explicitly requested via User.scope('withPassword').
      defaultScope: { attributes: { exclude: ["passwordHash"] } },
      scopes: { withPassword: {} },
    },
  );
  return User;
};
