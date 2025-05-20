import { EventDto } from "@api-contracts/dto/event/event.dto";
import { RewardRuleDto } from "@api-contracts/dto/reward/reward-rule.dto";

export class EventDetailsDto extends EventDto {
  rewardRules!: RewardRuleDto[];
}
