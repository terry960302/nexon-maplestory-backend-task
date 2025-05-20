import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  RewardRule,
  RewardRuleSchema,
} from '@event-microservice/infrastructure/schemas/reward-rule.schema';
import {
  StageRuleConfig,
  StageRuleConfigSchema,
} from '@event-microservice/infrastructure/schemas/rules/stage-rule-config.schema';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';

@Schema()
export class StageRule extends RewardRule {
  @Prop({ type: StageRuleConfigSchema, required: true })
  config: StageRuleConfig;
}
export const StageRuleSchema = SchemaFactory.createForClass(StageRule);
RewardRuleSchema.discriminator(RewardRuleType.STAGE, StageRuleSchema);
