import { Injectable } from '@nestjs/common';
import { RewardRequestDocument } from '@event-microservice/infrastructure/schemas/reward-request.schema';
import { RewardRequestDto } from '@api-contracts/dto/reward-request/reward-request.dto';
import { RewardItemDto } from '@api-contracts/dto/reward/reward-item.dto';
import { RewardRequestStatus } from '@api-contracts/enums/event/reward-request-status.enum';

@Injectable()
export class RewardRequestMapper {
  static toDto(document: RewardRequestDocument): RewardRequestDto {
    return {
      id: document._id.toString(),
      eventId: document.eventId.toString(),
      userId: document.userId.toString(),
      conditionMet: document.conditionMet,
      ruleIds: document.ruleIds.map((id) => id.toString()),
      rewards: this.mapRewardItems(document.rewards),
      status: document.status as RewardRequestStatus,
      reason: document.reason,
      requestedAt: document.requestedAt,
      processedAt: document.processedAt,
    };
  }

  static toDtoList(documents: RewardRequestDocument[]): RewardRequestDto[] {
    return documents.map((doc) => this.toDto(doc));
  }

  private static mapRewardItems(rewards: any[]): RewardItemDto[] {
    return rewards.map((reward) => ({
      type: reward.type,
      amount: reward.amount,
    }));
  }
}
