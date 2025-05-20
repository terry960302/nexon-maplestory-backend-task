import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  uri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME,
}));
