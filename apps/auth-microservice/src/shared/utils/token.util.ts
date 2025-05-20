import { randomBytes } from 'crypto';

export function randomTokenString(): string {
  return randomBytes(64).toString('hex');
}
