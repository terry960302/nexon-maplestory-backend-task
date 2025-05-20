import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RewardRequestStatus } from '@api-contracts/enums/event/reward-request-status.enum';
import {
  RewardItem,
  RewardItemSchema,
} from '@event-microservice/infrastructure/schemas/reward-item.schema';
import { RewardRule } from '@event-microservice/infrastructure/schemas/reward-rule.schema';

export type RewardRequestDocument = RewardRequest & Document;

@Schema({
  collection: 'reward_requests',
  timestamps: { createdAt: 'requestedAt', updatedAt: 'processedAt' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class RewardRequest {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Event.name, required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  conditionMet: boolean;

  @Prop({ type: [Types.ObjectId], required: true })
  ruleIds: Types.ObjectId[]; // 여러 개의 룰ID 기록

  @Prop({ type: [RewardItemSchema], default: [] })
  rewards: RewardItem[];

  @Prop({
    required: true,
    enum: RewardRequestStatus,
  })
  status: string;

  @Prop()
  reason?: string; // 수동 승인 시 승인 거절 이유, 혹은 실패사유

  @Prop()
  requestedAt: Date;

  @Prop()
  processedAt?: Date;

  // 운영자 승인 정보 (수동 승인 시)
  @Prop()
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;
}

export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);

// 가상 참조 설정 : populate() 호출 시 자동으로 rule 문서를 조회하여 연결
RewardRequestSchema.virtual('rule', {
  ref: RewardRule.name,
  localField: 'ruleIds',
  foreignField: '_id',
  justOne: false,
});

// 인덱스 설정: 중복 요청 방지
RewardRequestSchema.index(
  { userId: 1, eventId: 1, ruleIds: 1 },
  {
    unique: true,
    partialFilterExpression: { status: RewardRequestStatus.SUCCESS },
  },
);
// 상태별 조회 성능
RewardRequestSchema.index({ status: 1 });
