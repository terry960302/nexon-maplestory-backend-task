import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { UserActivityCreateRequestDto } from '@api-contracts/dto/user-activity/user-activity-create-request.dto';
import { UserActivityDto } from '@api-contracts/dto/user-activity/user-activity.dto';
import { UserActivityService } from '@event-microservice/application/services/user-activity.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @MessagePattern(MessagePatterns.USER_ACTIVITY_CREATE)
  async createUserActivity(
    @Payload() payload: UserActivityCreateRequestDto,
  ): Promise<UserActivityDto> {
    return this.userActivityService.create(payload);
  }
}
