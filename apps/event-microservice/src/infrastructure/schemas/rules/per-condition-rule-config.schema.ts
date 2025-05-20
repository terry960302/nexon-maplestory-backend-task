import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class PerConditionRuleConfig {
  @Prop({ required: true })
  metric: string;

  @Prop({ required: true })
  perThreshold: number;
}
export const PerConditionRuleConfigSchema = SchemaFactory.createForClass(
  PerConditionRuleConfig,
);
