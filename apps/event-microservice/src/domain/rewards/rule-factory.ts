import { RewardRule } from './reward-rule.entity';
import { PerConditionRule } from '@event-microservice/domain/rewards/per-condition.rule';
import { StageRule } from '@event-microservice/domain/rewards/stage.rule';
import { FinalRule } from '@event-microservice/domain/rewards/final.rule';
import { RewardRuleDocument } from '@event-microservice/infrastructure/schemas/reward-rule.schema';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import {
  EventErrorCode,
  EventErrors,
} from '@event-microservice/shared/exceptions/event-error-code.enum';

export function createRulesFromDocs(docs: RewardRuleDocument[]): RewardRule[] {
  // 규칙이 없는 경우 빈 배열 반환
  if (!docs) return [];
  const rules: RewardRule[] = docs.map((doc) => {
    switch (doc.ruleType) {
      case RewardRuleType.PER_CONDITION:
        return new PerConditionRule(
          doc._id.toString(),
          doc.rewardItems,
          doc.config,
        );
      case RewardRuleType.STAGE:
        return new StageRule(
          doc._id.toString(),
          doc.rewardItems,
          doc.config,
          [] as any, // 우선 빈 배열로 넣어두고, 아래에서 채워넣을 예정
        );

      case RewardRuleType.FINAL:
        return new FinalRule(doc._id.toString(), doc.rewardItems, doc.config);

      default:
        throw new EventException(
          EventErrors[EventErrorCode.UNSUPPORTED_RULE_TYPE],
        );
    }
  });
  docs.forEach((doc, i) => {
    if (doc.ruleType === RewardRuleType.STAGE) {
      rules[i] = new StageRule(
        doc._id.toString(),
        doc.rewardItems,
        doc.config, // 스테이지 규칙의 설정값 (예: 목표치)
        rules, // 누적 규칙들을 참조하기 위해 전체 규칙 배열 전달
      );
    } else if (doc.ruleType === RewardRuleType.FINAL) {
      rules[i] = new FinalRule(
        doc._id.toString(),
        doc.rewardItems,
        doc.config, // 최종 보상 규칙의 설정값
      );
    }
  });
  return rules;
}
