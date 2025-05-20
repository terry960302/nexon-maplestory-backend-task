import { RewardRule } from '@event-microservice/domain/rewards/reward-rule.entity';
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';

export class RewardEngine {
  constructor(private readonly rules: RewardRule[]) {}

  run(
    activity: Record<string, any>,
    pastRuleIds: string[],
  ): { newAchievedRuleIds: string[]; rewards: RewardItem[] } {
    const ruleIds = new Set(pastRuleIds);
    const rewards: RewardItem[] = [];

    for (const rule of this.rules) {
      // 규칙별로 보상 지급 만족 여부 검사
      const items: RewardItem[] = rule.apply(activity, ruleIds);
      // 보상 지급 만족 여부 검사 결과 보상 지급
      if (items.length) {
        rewards.push(...items);
      }
    }

    // 보상 지급 만족 여부 검사 결과 보상 지급 결과 중 새롭게 달성한 규칙을 반환
    const newAchievedRuleIds = Array.from(ruleIds).filter(
      (id) => !pastRuleIds.includes(id),
    );

    // 새롭게 달성한 규칙 및 보상 지급 결과 반환(새롭게 달성한 규칙은 중복안되게 하기 위함)
    return { newAchievedRuleIds, rewards };
  }
}
