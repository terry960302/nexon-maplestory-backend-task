import { RewardItemDto } from "@api-contracts/dto/reward/reward-item.dto";
import { RewardRuleOptionDto } from "@api-contracts/dto/reward/reward-rule-option.dto";
import { IsNotEmpty } from "class-validator";

export class RewardAddRequestDto {
  @IsNotEmpty()
  eventId!: string;
  rewardItem!: RewardItemDto;
  ruleOptions!: RewardRuleOptionDto;
}
