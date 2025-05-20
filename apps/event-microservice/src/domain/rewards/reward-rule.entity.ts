import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';

// 보상 규칙 도메인 엔티티
export abstract class RewardRule {
  constructor(
    public readonly id: string,
    public readonly rewardItems: RewardItem[],
    protected readonly config: any,
  ) {}

  abstract apply(
    activity: Record<string, any>,
    state: Set<string>,
  ): RewardItem[];
}
