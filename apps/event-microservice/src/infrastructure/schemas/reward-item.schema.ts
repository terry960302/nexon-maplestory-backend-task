import { RewardType } from '@api-contracts/enums/event/reward-type.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class RewardItem {
  @Prop({ required: true, enum: RewardType })
  type: string;

  @Prop({ required: true, min: 0 })
  amount: number;
}

export type RewardItemDocument = RewardItem & Document;
export const RewardItemSchema = SchemaFactory.createForClass(RewardItem);
