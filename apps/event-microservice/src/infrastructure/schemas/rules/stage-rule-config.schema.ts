import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class StageRuleConfig {
  @Prop({ required: true })
  metric: string;

  @Prop({ required: true })
  stageThreshold: number;
}
export const StageRuleConfigSchema =
  SchemaFactory.createForClass(StageRuleConfig);
