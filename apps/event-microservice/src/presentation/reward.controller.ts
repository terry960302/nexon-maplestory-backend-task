import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { EventParamDto } from '@api-contracts/dto/event/event-param.dto';
import { RewardAddRequestDto } from '@api-contracts/dto/reward/reward-add-request.dto';
import { RewardService } from '@event-microservice/application/services/reward.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @MessagePattern(MessagePatterns.REWARDS_LIST)
  async findByEventId(@Payload() param: EventParamDto) {
    return this.rewardService.findByEventId(param);
  }

  @MessagePattern(MessagePatterns.REWARDS_ADD)
  async addReward(@Payload() dto: RewardAddRequestDto) {
    return this.rewardService.addReward(dto);
  }
}
