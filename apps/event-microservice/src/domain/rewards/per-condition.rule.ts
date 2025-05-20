import { RewardRule } from '@event-microservice/domain/rewards/reward-rule.entity';
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';

export class PerConditionRule extends RewardRule {
  apply(activity: Record<string, any>, ruleIds: Set<string>): RewardItem[] {
    const { metric, perThreshold } = this.config;
    if (ruleIds.has(this.id) || activity[metric] < perThreshold) return [];
    ruleIds.add(this.id);
    return this.rewardItems;
  }
}
