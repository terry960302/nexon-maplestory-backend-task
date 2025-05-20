import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateWriteOpResult } from 'mongoose';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '@auth-microservice/infrastructure/schemas/refresh-token.schema';
import { DatabaseRpcException } from '@api-contracts/exceptions/database-rpc.exception';
import { PasswordUtil } from '@auth-microservice/shared/utils/password.util';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly model: Model<RefreshTokenDocument>,
  ) {}

  create(
    userId: Types.ObjectId,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshTokenDocument> {
    try {
      const doc = new this.model({
        _id: new Types.ObjectId(),
        userId,
        tokenHash,
        expiresAt,
      });
      return doc.save();
    } catch (error) {
      throw new DatabaseRpcException(error);
    }
  }

  async findByToken(token: string): Promise<RefreshTokenDocument | null> {
    const tokens = await this.model.find({
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    for (const doc of tokens) {
      if (await PasswordUtil.compare(token, doc.tokenHash)) {
        return doc;
      }
    }
    return null;
  }

  async revoke(id: Types.ObjectId): Promise<void> {
    try {
      await this.model.updateOne({ _id: id }, { revoked: true }).exec();
      return;
    } catch (error) {
      throw new DatabaseRpcException(error);
    }
  }

  // 특정 유저의 모든 유효 토큰을 폐기 처리
  async revokeAllByUser(userId: Types.ObjectId): Promise<UpdateWriteOpResult> {
    return this.model.updateMany(
      { userId, revoked: false, expiresAt: { $gt: new Date() } },
      { $set: { revoked: true } },
    );
  }
}
