import { UserActivityCreateRequestDto } from '@api-contracts/dto/user-activity/user-activity-create-request.dto';
import { UserActivityRepository } from '@event-microservice/infrastructure/repositories/user-activity.repository';
import { Injectable } from '@nestjs/common';
import { UserActivityMapper } from '@event-microservice/application/mappers/user-activity.mapper';

@Injectable()
export class UserActivityService {
  constructor(
    private readonly userActivityRepository: UserActivityRepository,
  ) {}

  async create(requestDto: UserActivityCreateRequestDto) {
    const userActivity = await this.userActivityRepository.createOrUpdate(
      requestDto.userId,
      requestDto.loginStreak,
      requestDto.inviteCount,
      requestDto.purchaseTotal,
    );
    return UserActivityMapper.toUserActivityDto(userActivity);
  }
}
