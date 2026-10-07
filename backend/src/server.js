import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { purgeExpiredTokens } from './services/authService.js';

async function start() {
  await sequelize.authenticate();
  // Dev convenience only. In production manage the schema with migrations (sequelize-cli / umzug).
  if (env.db.sync && !env.isProd) await sequelize.sync();

  const server = app.listen(env.port, () => console.log(`API listening on :${env.port} (${env.nodeEnv})`));

  const purge = setInterval(() => purgeExpiredTokens().catch((e) => console.error('token purge failed', e)), 6 * 3600 * 1000);
  purge.unref();

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    clearInterval(purge);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
