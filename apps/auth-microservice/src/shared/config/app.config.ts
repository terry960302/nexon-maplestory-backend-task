import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.SERVICE_AUTH_PORT) || 8081,
  host: process.env.SERVICE_AUTH_HOST || 'localhost',
}));
