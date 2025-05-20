import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  RewardRule,
  RewardRuleSchema,
} from '@event-microservice/infrastructure/schemas/reward-rule.schema';
import {
  PerConditionRuleConfig,
  PerConditionRuleConfigSchema,
} from '@event-microservice/infrastructure/schemas/rules/per-condition-rule-config.schema';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';

@Schema()
export class PerConditionRule extends RewardRule {
  @Prop({ type: PerConditionRuleConfigSchema, required: true })
  config: PerConditionRuleConfig;
}
export const PerConditionRuleSchema =
  SchemaFactory.createForClass(PerConditionRule);

RewardRuleSchema.discriminator(
  RewardRuleType.PER_CONDITION,
  PerConditionRuleSchema,
);
