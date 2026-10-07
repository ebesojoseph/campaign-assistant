import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import { corsMiddleware, securityHeaders } from "./middlewares/security.js";
import routes from "./routes/index.js";
import morgan from "morgan";

const app = express();

app.disable("x-powered-by");
console.log(env.trustProxy)
if (env.trustProxy) app.set("trust proxy", env.trustProxy);

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms"),
);

app.get("/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() }),
);

app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
