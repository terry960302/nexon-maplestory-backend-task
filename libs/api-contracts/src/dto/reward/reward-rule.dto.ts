import { RewardRuleType } from "@api-contracts/enums/event/reward-rule-type.enum";
import { RewardItemDto } from "@api-contracts/dto/reward/reward-item.dto";

export class RewardRuleDto {
  id!: string;
  ruleType!: RewardRuleType;
  config!: any;
  rewardItems!: RewardItemDto[];
}
