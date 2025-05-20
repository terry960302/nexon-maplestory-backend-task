import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import {
  RewardRule,
  RewardRuleSchema,
} from '@event-microservice/infrastructure/schemas/reward-rule.schema';

@Schema({ collection: 'events', timestamps: true })
export class Event {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  endedAt: Date;

  @Prop({
    required: true,
    type: String,
    enum: EventStatus,
    default: EventStatus.ACTIVE,
  })
  status: EventStatus;

  // 자동 지급 (혹은 검토 후 수동 지급)
  @Prop({ default: true }) // default: true로 두면 자동지급이 기본값
  autoReward: boolean;

  @Prop({ type: [RewardRuleSchema], default: [] })
  rewardRules: RewardRule[];
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);

// 인덱스 설정: 기간 조회 및 상태 기반 필터 빈번 사용 대비
EventSchema.index({ startedAt: 1, endedAt: 1 });
EventSchema.index({ status: 1 });
