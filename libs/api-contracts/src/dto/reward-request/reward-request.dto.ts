import { RewardRequestStatus } from "@api-contracts/enums/event/reward-request-status.enum";
import { RewardItemDto } from "@api-contracts/dto/reward/reward-item.dto";

export class RewardRequestDto {
  id!: string;
  eventId!: string;
  userId!: string;
  conditionMet!: boolean;
  ruleIds!: string[];
  rewards!: RewardItemDto[];
  status!: RewardRequestStatus;
  reason?: string;
  requestedAt!: Date;
  processedAt?: Date;
}
