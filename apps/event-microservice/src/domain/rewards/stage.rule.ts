import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';
import { RewardRule } from '@event-microservice/domain/rewards/reward-rule.entity';

export class StageRule extends RewardRule {
  constructor(
    id: string,
    rewardItems: RewardItem[],
    config: any,
    private readonly allRules: RewardRule[],
  ) {
    super(id, rewardItems, config);
  }

  apply(activity: Record<string, any>, ruleIds: Set<string>): RewardItem[] {
    const { metric, stageThreshold } = this.config;
    if (ruleIds.has(this.id) || activity[metric] < stageThreshold) return [];

    // 현재 달성한 단계까지의 모든 보상을 지급
    const currentValue = activity[metric];
    const achievedStages = Math.floor(currentValue / stageThreshold);

    // 현재 규칙의 단계가 달성한 단계보다 크면 보상 지급하지 않음
    if (achievedStages < stageThreshold) return [];

    // 이미 지급된 단계는 제외
    const stageRules = this.allRules
      .filter((r) => r instanceof StageRule)
      .map((r) => r as StageRule);

    const alreadyRewardedStages = stageRules
      .filter((r) => ruleIds.has(r.id))
      .map((r) => r.config.stageThreshold);

    // 현재 단계가 이미 지급된 단계가 아니면 보상 지급
    if (!alreadyRewardedStages.includes(stageThreshold)) {
      ruleIds.add(this.id);
      return this.rewardItems;
    }

    return [];
  }
}
