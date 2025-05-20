import { ExceptionDescriptor } from '@api-contracts/exceptions/exception-descriptor.interface';

export enum EventErrorCode {
  EVENT_NOT_FOUND = 'EVENT_0001',
  INVALID_EVENT_STATUS = 'EVENT_0002',
  INVALID_EVENT_PERIOD = 'EVENT_0003',
  NOT_ENOUGH_POINTS = 'EVENT_0004',
  REWARD_ALREADY_CLAIMED = 'EVENT_0005',
  DUPLICATED_EVENT = 'EVENT_0006',
  REWARDS_NOT_FOUND = 'EVENT_0009',
  REWARD_REQUESTS_CONDITION_NOT_MET = 'EVENT_0010',
  UNSUPPORTED_RULE_TYPE = 'EVENT_0011',
  REWARD_RULE_NOT_FOUND = 'EVENT_0012',
  INVALID_RULE_CONFIG = 'EVENT_0013',
  REWARD_ADDITION_FAILED = 'EVENT_0014',
  USER_ACTIVITY_NOT_FOUND = 'EVENT_0015',
  EVENT_OUT_OF_PERIOD = 'EVENT_0016',
  EVENT_INACTIVE = 'EVENT_0017',
  REWARD_REQUEST_NOT_FOUND = 'EVENT_0018',
  REWARD_ALREADY_APPROVED = 'EVENT_0019',
  REWARD_REQUEST_STATUS_NOT_PENDING = 'EVENT_0020',
}

export const EventErrors: Record<EventErrorCode, ExceptionDescriptor> = {
  [EventErrorCode.EVENT_NOT_FOUND]: {
    errorCode: EventErrorCode.EVENT_NOT_FOUND,
    statusCode: 404,
    message: '해당 이벤트가 존재하지 않습니다.',
  },
  [EventErrorCode.INVALID_EVENT_STATUS]: {
    errorCode: EventErrorCode.INVALID_EVENT_STATUS,
    statusCode: 400,
    message: '이벤트 상태가 올바르지 않습니다.',
  },
  [EventErrorCode.INVALID_EVENT_PERIOD]: {
    errorCode: EventErrorCode.INVALID_EVENT_PERIOD,
    statusCode: 400,
    message: '이벤트 기간이 아닙니다.',
  },
  [EventErrorCode.NOT_ENOUGH_POINTS]: {
    errorCode: EventErrorCode.NOT_ENOUGH_POINTS,
    statusCode: 400,
    message: '포인트가 부족합니다.',
  },
  [EventErrorCode.REWARD_ALREADY_CLAIMED]: {
    errorCode: EventErrorCode.REWARD_ALREADY_CLAIMED,
    statusCode: 409,
    message: '이미 보상을 받았습니다.',
  },
  [EventErrorCode.DUPLICATED_EVENT]: {
    errorCode: EventErrorCode.DUPLICATED_EVENT,
    statusCode: 409,
    message: '이미 존재하는 이벤트입니다.',
  },
  [EventErrorCode.REWARDS_NOT_FOUND]: {
    errorCode: EventErrorCode.REWARDS_NOT_FOUND,
    statusCode: 404,
    message: '보상이 존재하지 않습니다.',
  },
  [EventErrorCode.REWARD_REQUESTS_CONDITION_NOT_MET]: {
    errorCode: EventErrorCode.REWARD_REQUESTS_CONDITION_NOT_MET,
    statusCode: 400,
    message: '이벤트 조건을 충족하지 않습니다.',
  },
  [EventErrorCode.UNSUPPORTED_RULE_TYPE]: {
    errorCode: EventErrorCode.UNSUPPORTED_RULE_TYPE,
    statusCode: 400,
    message: '지원하지 않는 규칙 타입입니다.',
  },
  [EventErrorCode.REWARD_RULE_NOT_FOUND]: {
    errorCode: EventErrorCode.REWARD_RULE_NOT_FOUND,
    statusCode: 404,
    message: '보상 규칙이 존재하지 않습니다.',
  },
  [EventErrorCode.INVALID_RULE_CONFIG]: {
    errorCode: EventErrorCode.INVALID_RULE_CONFIG,
    statusCode: 400,
    message: '규칙 설정이 올바르지 않습니다.',
  },
  [EventErrorCode.REWARD_ADDITION_FAILED]: {
    errorCode: EventErrorCode.REWARD_ADDITION_FAILED,
    statusCode: 400,
    message: '보상 추가에 실패했습니다.',
  },
  [EventErrorCode.USER_ACTIVITY_NOT_FOUND]: {
    errorCode: EventErrorCode.USER_ACTIVITY_NOT_FOUND,
    statusCode: 404,
    message: '사용자 활동 데이터가 존재하지 않습니다.',
  },
  [EventErrorCode.EVENT_OUT_OF_PERIOD]: {
    errorCode: EventErrorCode.EVENT_OUT_OF_PERIOD,
    statusCode: 400,
    message: '이벤트 기간이 아닙니다.',
  },
  [EventErrorCode.EVENT_INACTIVE]: {
    errorCode: EventErrorCode.EVENT_INACTIVE,
    statusCode: 400,
    message: '이벤트가 비활성화 상태입니다.',
  },
  [EventErrorCode.REWARD_REQUEST_NOT_FOUND]: {
    errorCode: EventErrorCode.REWARD_REQUEST_NOT_FOUND,
    statusCode: 404,
    message: '보상 지급 요청이 존재하지 않습니다.',
  },
  [EventErrorCode.REWARD_ALREADY_APPROVED]: {
    errorCode: EventErrorCode.REWARD_ALREADY_APPROVED,
    statusCode: 409,
    message: '이미 승인된 보상 지급 요청입니다.',
  },
  [EventErrorCode.REWARD_REQUEST_STATUS_NOT_PENDING]: {
    errorCode: EventErrorCode.REWARD_REQUEST_STATUS_NOT_PENDING,
    statusCode: 400,
    message: '보상 지급 요청 상태가 승인 대기가 아닙니다.',
  },
};
