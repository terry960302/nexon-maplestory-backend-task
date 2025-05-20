import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ type: Types.ObjectId }) // 기본 _id(ObjectId)
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  tokenHash!: string;

  @Prop({ default: () => new Date() })
  issuedAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  revoked!: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
