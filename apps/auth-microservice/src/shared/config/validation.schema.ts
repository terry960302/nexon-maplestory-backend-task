// src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // 실행 환경
  NODE_ENV: Joi.string()
    .valid('dev', 'prod', 'test')
    .default('dev')
    .description('실행 환경'),

  // 서버 설정
  SERVICE_AUTH_PORT: Joi.number().default(8081).description('서버 포트'),
  SERVICE_AUTH_HOST: Joi.string()
    .default('localhost')
    .description('서버 호스트'),

  // MongoDB 설정
  MONGODB_URI: Joi.string().required().description('MongoDB 연결 URI'),
  MONGODB_DB_NAME: Joi.string()
    .required()
    .description('MongoDB 데이터베이스 이름'),

  // JWT 설정
  JWT_SECRET_KEY: Joi.string()
    .required()
    .min(32)
    .description('JWT 서명에 사용할 비밀키'),
  JWT_ACCESS_EXPIRES_MIN: Joi.number()
    .default(15)
    .description('Access Token 만료 시간(분)'),
  JWT_REFRESH_EXPIRES_DAYS: Joi.number()
    .default(7)
    .description('Refresh Token 만료 시간(일)'),
}).messages({
  'any.required': '{{#label}} 환경변수가 필요합니다.',
  'string.min': '{{#label}}은(는) 최소 {{#limit}}자 이상이어야 합니다.',
  'string.valid': '{{#label}}은(는) 유효하지 않은 값입니다.',
  'number.base': '{{#label}}은(는) 숫자여야 합니다.',
});
