import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import {
  EventErrorCode,
  EventErrors,
} from '@event-microservice/shared/exceptions/event-error-code.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import { Injectable } from '@nestjs/common';

// 이벤트 및 보상 유효성 검증 서비스
@Injectable()
export class EventValidator {
  static validateEventPeriod(startedAt: Date, endedAt: Date): void {
    // 시작일이 종료일보다 이후인 경우
    // 시작일이 현재 시간보다 이전인 경우
    if (startedAt >= endedAt || startedAt < new Date()) {
      throw new EventException(
        EventErrors[EventErrorCode.INVALID_EVENT_PERIOD],
      );
    }
  }

  static checkActiveEvent(status: EventStatus): void {
    if (status !== EventStatus.ACTIVE) {
      throw new EventException(EventErrors[EventErrorCode.EVENT_INACTIVE]);
    }
  }

  static validateEventStatus(status: EventStatus): void {
    if (!Object.values(EventStatus).includes(status)) {
      throw new EventException(
        EventErrors[EventErrorCode.INVALID_EVENT_STATUS],
      );
    }
  }
}
