import { Injectable } from '@nestjs/common';
import { EventRepository } from '@event-microservice/infrastructure/repositories/event.repository';
import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import {
  EventErrorCode,
  EventErrors,
} from '@event-microservice/shared/exceptions/event-error-code.enum';
import { EventDto } from '@api-contracts/dto/event/event.dto';
import { EventGetQueryDto } from '@api-contracts/dto/event/event-get-query.dto';
import { EventParamDto } from '@api-contracts/dto/event/event-param.dto';
import { EventDetailsDto } from '@api-contracts/dto/event/event-details.dto';
import { EventCreateRequestDto } from '@api-contracts/dto/event/event-create-request.dto';
import { EventMapper } from '@event-microservice/application/mappers/event.mapper';
import { EventValidator } from '@event-microservice/application/validators/event.validator';
import { PaginatedDto } from '@api-contracts/dto/common/paginated.dto';
import { Types } from 'mongoose';
import { EventUpdateRequestDto } from '@api-contracts/dto/event/event-update-request.dto';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  // 이벤트 목록 조회
  async findAll(filter: EventGetQueryDto): Promise<PaginatedDto<EventDto>> {
    const events = await this.eventRepository.findAll(
      filter.active,
      filter.sortBy,
      filter.page,
      filter.pageSize,
    );
    const data = events.map((event) => EventMapper.toEventDto(event));
    const total = await this.eventRepository.count(filter);
    return {
      data,
      total,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }
  // 단일 이벤트 조회
  async findById(param: EventParamDto): Promise<EventDetailsDto> {
    const event = await this.eventRepository.findById(param.eventId);
    if (!event) {
      throw new EventException(EventErrors[EventErrorCode.EVENT_NOT_FOUND]);
    }
    return EventMapper.toEventDetailsDto(event);
  }

  // 새 이벤트 생성
  async create(createEventDto: EventCreateRequestDto): Promise<EventDto> {
    // 이벤트 기간 유효성 검사
    EventValidator.validateEventPeriod(
      new Date(createEventDto.startedAt),
      new Date(createEventDto.endedAt),
    );

    // 이벤트 생성
    const toCreate = {
      _id: new Types.ObjectId(),
      ...createEventDto,
      startedAt: new Date(createEventDto.startedAt),
      endedAt: new Date(createEventDto.endedAt),
      status: this.determineInitialStatus(
        new Date(createEventDto.startedAt),
        new Date(createEventDto.endedAt),
      ),
      rewardRules: [],
    };
    const existingEvent = await this.eventRepository.findByName(toCreate.name);
    if (existingEvent) {
      throw new EventException(EventErrors[EventErrorCode.DUPLICATED_EVENT]);
    }
    const createdEvent = await this.eventRepository.create(toCreate);
    return EventMapper.toEventDto(createdEvent);
  }

  // 이벤트 상태 업데이트
  async updateStatus(requestDto: EventUpdateRequestDto): Promise<EventDto> {
    EventValidator.validateEventStatus(requestDto.status);
    const event = await this.findById({ eventId: requestDto.eventId });

    if (event.status === requestDto.status) {
      return event;
    }

    const updatedEvent = await this.eventRepository.updateStatus(
      requestDto.eventId,
      requestDto.status,
    );
    if (!updatedEvent) {
      throw new EventException(EventErrors[EventErrorCode.EVENT_NOT_FOUND]);
    }

    return EventMapper.toEventDto(updatedEvent);
  }

  private determineInitialStatus(startedAt: Date, endedAt: Date): EventStatus {
    const now = new Date();
    return startedAt <= now && endedAt >= now
      ? EventStatus.ACTIVE
      : EventStatus.INACTIVE;
  }
}
