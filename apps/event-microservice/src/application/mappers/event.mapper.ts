import { EventDocument } from '@event-microservice/infrastructure/schemas/event.schema';
import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import { EventDto } from '@api-contracts/dto/event/event.dto';
import { EventDetailsDto } from '@api-contracts/dto/event/event-details.dto';
import { RewardMapper } from './reward.mapper';

export class EventMapper {
  static toEventDto(event: EventDocument): EventDto {
    return {
      id: event._id.toString(),
      name: event.name,
      startedAt: event.startedAt.toISOString(),
      endedAt: event.endedAt.toISOString(),
      status: event.status as EventStatus,
    };
  }

  static toEventDetailsDto(event: EventDocument): EventDetailsDto {
    return {
      ...this.toEventDto(event),
      rewardRules: event.rewardRules?.map((rule) =>
        RewardMapper.toRewardRuleDto(rule),
      ),
    };
  }
}
