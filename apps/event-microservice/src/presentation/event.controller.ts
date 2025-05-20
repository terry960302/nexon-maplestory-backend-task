import { Controller } from '@nestjs/common';
import { EventService } from '@event-microservice/application/services/event.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventCreateRequestDto } from '@api-contracts/dto/event/event-create-request.dto';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { EventParamDto } from '@api-contracts/dto/event/event-param.dto';
import { EventGetQueryDto } from '@api-contracts/dto/event/event-get-query.dto';
import { EventUpdateRequestDto } from '@api-contracts/dto/event/event-update-request.dto';
@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @MessagePattern(MessagePatterns.EVENTS_CREATE)
  async createEvent(@Payload() payload: EventCreateRequestDto) {
    return this.eventService.create(payload);
  }

  @MessagePattern(MessagePatterns.EVENTS_GET)
  async getEventById(@Payload() payload: EventParamDto) {
    return this.eventService.findById(payload);
  }

  @MessagePattern(MessagePatterns.EVENTS_LIST)
  async paginateEvents(@Payload() payload: EventGetQueryDto) {
    return this.eventService.findAll(payload);
  }

  @MessagePattern(MessagePatterns.EVENTS_UPDATE)
  async updateEventStatus(@Payload() payload: EventUpdateRequestDto) {
    return this.eventService.updateStatus(payload);
  }
}
