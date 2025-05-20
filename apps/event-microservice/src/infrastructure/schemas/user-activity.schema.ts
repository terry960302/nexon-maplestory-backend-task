import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'user_activities',
  timestamps: { updatedAt: 'lastUpdatedAt' },
})
export class UserActivity {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ default: 0, min: 0 })
  loginStreak: number;

  @Prop({ default: 0, min: 0 })
  inviteCount: number;

  @Prop({ default: 0, min: 0 })
  purchaseTotal: number;

  @Prop()
  lastUpdatedAt: Date;
}

export type UserActivityDocument = UserActivity & Document;
export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
// 인덱스 설정
UserActivitySchema.index({ userId: 1, eventId: 1 }, { unique: true });
