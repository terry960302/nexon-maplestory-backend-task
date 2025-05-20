import { RewardType } from "@api-contracts/enums/event/reward-type.enum";

export class RewardDto {
  id!: string; // UUID
  type!: RewardType;
  amount!: number;
}
