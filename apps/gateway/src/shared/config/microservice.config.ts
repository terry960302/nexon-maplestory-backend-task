import { registerAs } from '@nestjs/config';

export default registerAs('microservice', () => ({
  retryAttempts: +process.env.RETRY_ATTEMPS,
  retryDelay: +process.env.RETRY_DELAY,
  authMicroservice: {
    host: process.env.SERVICE_AUTH_HOST,
    port: +process.env.SERVICE_AUTH_PORT,
  },
  eventMicroservice: {
    host: process.env.SERVICE_EVENT_HOST,
    port: +process.env.SERVICE_EVENT_PORT,
  },
}));
