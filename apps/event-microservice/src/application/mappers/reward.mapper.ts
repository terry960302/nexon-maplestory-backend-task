import { RewardItemDto } from '@api-contracts/dto/reward/reward-item.dto';
import { RewardRuleDto } from '@api-contracts/dto/reward/reward-rule.dto';
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';
import { RewardRule } from '@event-microservice/infrastructure/schemas/reward-rule.schema';
import { FinalRule } from '@event-microservice/infrastructure/schemas/rules/final-rule.schema';
import { PerConditionRule } from '@event-microservice/infrastructure/schemas/rules/per-condition-rule.schema';
import { StageRule } from '@event-microservice/infrastructure/schemas/rules/stage-rule.schema';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';
import { RewardType } from '@api-contracts/enums/event/reward-type.enum';
import {
  EventErrorCode,
  EventErrors,
} from '@event-microservice/shared/exceptions/event-error-code.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';

export class RewardMapper {
  static toRewardItemDto(item: RewardItem): RewardItemDto {
    return {
      type: item.type as RewardType,
      amount: item.amount,
    };
  }

  static toRewardRuleDto(rule: RewardRule): RewardRuleDto {
    const baseRule = {
      id: rule._id.toString(),
      ruleType: rule.ruleType as RewardRuleType,
      rewardItems: rule.rewardItems.map((item) =>
        RewardMapper.toRewardItemDto(item),
      ),
    };

    switch (rule.ruleType) {
      case RewardRuleType.PER_CONDITION:
        const perConditionRule = rule as PerConditionRule;
        return {
          ...baseRule,
          config: {
            metric: perConditionRule.config.metric,
            perThreshold: perConditionRule.config.perThreshold,
          },
        };

      case RewardRuleType.STAGE:
        const stageRule = rule as StageRule;
        return {
          ...baseRule,
          config: {
            metric: stageRule.config.metric,
            stageThreshold: stageRule.config.stageThreshold,
          },
        };

      case RewardRuleType.FINAL:
        const finalRule = rule as FinalRule;
        return {
          ...baseRule,
          config: {
            prerequisiteRuleIds: finalRule.config.prerequisiteRuleIds,
          },
        };

      default:
        throw new EventException(
          EventErrors[EventErrorCode.UNSUPPORTED_RULE_TYPE],
        );
    }
  }
}
