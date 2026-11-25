import pino from 'pino';

export const logger = pino({
  name: 'trailforge-api',
  level: process.env['LOG_LEVEL'] ?? 'info',
});
