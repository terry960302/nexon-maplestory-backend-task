import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RewardItemSchema, RewardItem } from './reward-item.schema';
import { Types } from 'mongoose';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';

export type RewardRuleDocument = RewardRule & Document;

@Schema({ _id: true })
export class RewardRule {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, enum: RewardRuleType })
  ruleType: string;

  // Rule 별 설정을 통째로 담는 JSON (Discriminator 사용)
  @Prop({ type: {}, required: true })
  config: any;

  @Prop({ type: [RewardItemSchema], default: [] })
  rewardItems: RewardItem[];
}

export const RewardRuleSchema = SchemaFactory.createForClass(RewardRule);
