import { Controller } from '@nestjs/common';
import { RewardRequestService } from '@event-microservice/application/services/reward-request.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { RewardRequestCreateDto } from '@api-contracts/dto/reward-request/reward-request-create.dto';
import { RewardRequestGetQueryDto } from '@api-contracts/dto/reward-request/reward-request-get-query.dto';
import { RewardRequestApproveDto } from '@api-contracts/dto/reward-request/reward-request-approve.dto';
@Controller()
export class RewardRequestController {
  constructor(private readonly rewardRequestService: RewardRequestService) {}

  @MessagePattern(MessagePatterns.REWARD_REQUESTS_CREATE)
  async createRewardRequest(
    @Payload() payload: { eventId: string; dto: RewardRequestCreateDto },
  ) {
    return this.rewardRequestService.createRewardRequest(
      payload.eventId,
      payload.dto,
    );
  }

  @MessagePattern(MessagePatterns.REWARD_REQUESTS_EVENT_LIST)
  async paginateAllRewardRequests(
    @Payload() payload: RewardRequestGetQueryDto,
  ) {
    return this.rewardRequestService.paginate(payload);
  }

  @MessagePattern(MessagePatterns.REWARD_REQUESTS_USER_LIST)
  async paginateRewardRequestsByUser(
    @Payload() payload: RewardRequestGetQueryDto,
  ) {
    return this.rewardRequestService.paginate(payload);
  }

  @MessagePattern(MessagePatterns.REWARD_REQUESTS_APPROVE)
  async approveRewardRequest(@Payload() payload: RewardRequestApproveDto) {
    return this.rewardRequestService.approveRewardRequest(payload);
  }
}
