import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Sequelize } = require("sequelize");
import { env } from "./env.js";

const define = { underscored: true, timestamps: true };

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: "mysql",
    logging: env.db.logging ? console.log : false,
    timezone: "+00:00",
    define,
    dialectOptions: { charset: "utf8mb4" },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
);
