import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  FinalRuleConfig,
  FinalRuleConfigSchema,
} from '@event-microservice/infrastructure/schemas/rules/final-rule-config.schema';
import {
  RewardRule,
  RewardRuleSchema,
} from '@event-microservice/infrastructure/schemas/reward-rule.schema';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';

@Schema()
export class FinalRule extends RewardRule {
  @Prop({ type: FinalRuleConfigSchema, required: true })
  config: FinalRuleConfig;
}
export const FinalRuleSchema = SchemaFactory.createForClass(FinalRule);
RewardRuleSchema.discriminator(RewardRuleType.FINAL, FinalRuleSchema);
