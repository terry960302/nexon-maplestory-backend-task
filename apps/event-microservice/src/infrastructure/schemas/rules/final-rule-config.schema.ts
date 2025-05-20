import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class FinalRuleConfig {
  @Prop({ required: true })
  prerequisiteRuleIds: string[];
}
export const FinalRuleConfigSchema =
  SchemaFactory.createForClass(FinalRuleConfig);
