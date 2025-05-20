import { RewardRuleType } from "@api-contracts/enums/event/reward-rule-type.enum";
import { IsNotEmpty } from "class-validator";

export class RewardRuleOptionDto {
  // 기존 Rule에 보상을 추가하고자 할때
  ruleId?: string;
  // 새로운 Rule에 보상을 추가하고자 할때
  newRule?: {
    ruleType: RewardRuleType;
    config: any;
  };
}
