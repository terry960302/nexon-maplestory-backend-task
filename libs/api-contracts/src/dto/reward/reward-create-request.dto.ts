import { RewardType } from "@api-contracts/enums/event/reward-type.enum";

export class RewardCreateRequestDto {
  type!: RewardType;
  amount!: number;
}
