import { createApp } from './app.js';
import { runMigrations } from './db/migrate.js';
import { closePool } from './db/pool.js';
import { loadEnv } from './env.js';
import { logger } from './logger.js';

async function main() {
  const env = loadEnv();
  if (process.env['DATABASE_URL']) {
    await runMigrations();
    logger.info('database migrations applied');
  }
  const app = createApp({ corsOrigin: env.CORS_ORIGIN });
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'TrailForge API listening');
  });

  async function shutdown(signal: string) {
    logger.info({ signal }, 'Shutting down');
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
      await closePool().catch(() => undefined);
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start API');
  process.exit(1);
});
