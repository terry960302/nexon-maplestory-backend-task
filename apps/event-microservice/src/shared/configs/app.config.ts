import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.SERVICE_EVENT_PORT) || 8082,
  host: process.env.SERVICE_EVENT_HOST || 'localhost',
}));
