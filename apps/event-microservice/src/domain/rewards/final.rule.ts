import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';
import { RewardRule } from '@event-microservice/domain/rewards/reward-rule.entity';

export class FinalRule extends RewardRule {
  apply(activity: Record<string, any>, state: Set<string>): RewardItem[] {
    const { prerequisiteRuleIds } = this.config;
    if (state.has(this.id)) return [];
    if (!prerequisiteRuleIds.every((rid: string) => state.has(rid))) return [];
    state.add(this.id);
    return this.rewardItems;
  }
}
