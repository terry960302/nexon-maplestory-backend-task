import { UserActivityDocument } from '@event-microservice/infrastructure/schemas/user-activity.schema';
import { UserActivityDto } from '@api-contracts/dto/user-activity/user-activity.dto';

export class UserActivityMapper {
  static toUserActivityDto(
    userActivity: UserActivityDocument,
  ): UserActivityDto {
    return {
      id: userActivity._id.toString(),
      userId: userActivity.userId.toString(),
      loginStreak: userActivity.loginStreak,
      inviteCount: userActivity.inviteCount,
      purchaseTotal: userActivity.purchaseTotal,
    };
  }
}
