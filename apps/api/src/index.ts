import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { logger } from './logger.js';

const env = loadEnv();
const app = createApp({ corsOrigin: env.CORS_ORIGIN });
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'TrailForge API listening');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
