import * as bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;

export class PasswordUtil {
  static async hash(
    plain: string,
    saltRounds: number = DEFAULT_SALT_ROUNDS,
  ): Promise<string> {
    return bcrypt.hash(plain, saltRounds);
  }

  static async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
