import { RewardType } from "@api-contracts/enums/event/reward-type.enum";
export class RewardResponseDto {
  id!: string; // UUID
  type!: RewardType;
  amount!: number;
}
