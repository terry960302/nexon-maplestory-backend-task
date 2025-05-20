import * as jwt from 'jsonwebtoken';

export function verifyJwtToken(token: string, secret: string): any {
  try {
    return jwt.verify(token, secret); // JWT_SECRET은 .env 또는 config에서 불러오기
  } catch (err) {
    return null;
  }
}
