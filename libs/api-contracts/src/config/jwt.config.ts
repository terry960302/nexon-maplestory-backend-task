import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  secretKey: process.env.JWT_SECRET_KEY,
  accessExpiresMins: Number(process.env.JWT_ACCESS_EXPIRES_IN_MINS),
  refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS),
}));
