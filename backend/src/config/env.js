import 'dotenv/config'

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";
const isTest = NODE_ENV === "test";

const int = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? d : n;
};

const secret = (name, devFallback) => {
  const value = process.env[name];
  if (value && value.length >= 32) return value;
  if (isProd)
    throw new Error(
      `${name} must be set and at least 32 characters long in production`,
    );
  return value || devFallback;
};

const sameSite = (process.env.COOKIE_SAMESITE || "strict").toLowerCase();

export const env = Object.freeze({
  nodeEnv: NODE_ENV,
  isProd,
  isTest,
  port: int(process.env.PORT, 4000),
  trustProxy:
    process.env.TRUST_PROXY === "true"
      ? true
      : int(process.env.TRUST_PROXY, 0) || false,
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  db: {
    dialect: process.env.DB_DIALECT || "mysql", // 'sqlite' is only used by the test-suite
    host: process.env.DB_HOST || "127.0.0.1",
    port: int(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || "ai_campaign_assistant",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    logging: process.env.DB_LOGGING === "true",
    sync: process.env.DB_SYNC === "true",
  },
  jwt: {
    accessSecret: secret(
      "JWT_ACCESS_SECRET",
      "dev-only-access-secret-change-me-0123456789",
    ),
    refreshSecret: secret(
      "JWT_REFRESH_SECRET",
      "dev-only-refresh-secret-change-me-9876543210",
    ),
    issuer: process.env.JWT_ISSUER || "dme-ai-campaign-assistant",
    accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTtlDays: int(process.env.REFRESH_TOKEN_TTL_DAYS, 7),
  },
  bcryptRounds: int(process.env.BCRYPT_ROUNDS, isTest ? 4 : 12),
  cookie: {
    name: "refreshToken",
    sameSite: ["strict", "lax", "none"].includes(sameSite)
      ? sameSite
      : "strict",
    secure:
      isProd || process.env.COOKIE_SECURE === "true" || sameSite === "none",
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/api/auth", // the cookie is only ever sent to the auth endpoints
  },
  ai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    maxTokens: int(process.env.OPENAI_MAX_TOKENS, 800),
    timeoutMs: int(process.env.OPENAI_TIMEOUT_MS, 30000),
  },
});
