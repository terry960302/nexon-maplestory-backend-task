// src/auth/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '@api-contracts/enums/auth/role.enum';

export type UserDocument = User & Document;

@Schema({
  collection: 'users',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class User {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: [String], default: [Role.USER] })
  roles!: string[];

  // createdAt, updatedAt 는 timestamps 옵션으로 자동 생성
  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
