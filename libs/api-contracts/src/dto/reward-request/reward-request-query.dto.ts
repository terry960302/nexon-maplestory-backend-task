import { RewardRequestStatus } from "@api-contracts/enums/event/reward-request-status.enum";

export class RewardRequestQueryDto {
  eventId?: string; // optional UUID
  status?: RewardRequestStatus; // optional
}
