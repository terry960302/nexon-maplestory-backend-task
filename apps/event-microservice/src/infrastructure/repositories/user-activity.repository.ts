import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  UserActivity,
  UserActivityDocument,
} from '@event-microservice/infrastructure/schemas/user-activity.schema';
import { DatabaseRpcException } from '@api-contracts/exceptions/database-rpc.exception';

@Injectable()
export class UserActivityRepository {
  constructor(
    @InjectModel(UserActivity.name)
    private userActivityModel: Model<UserActivityDocument>,
  ) {}

  async findByUserId(
    userId: string,
    session?: ClientSession,
  ): Promise<UserActivityDocument | null> {
    try {
      return this.userActivityModel
        .findOne({
          userId: new Types.ObjectId(userId),
        })
        .session(session)
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async createOrUpdate(
    userId: string,
    loginStreak?: number,
    inviteCount?: number,
    purchaseTotal?: number,
    session?: ClientSession,
  ): Promise<UserActivityDocument> {
    try {
      return this.userActivityModel
        .findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
          },
          {
            $set: {
              loginStreak,
              inviteCount,
              purchaseTotal,
              lastUpdatedAt: new Date(),
            },
          },
          {
            new: true,
            upsert: true,
          },
        )
        .session(session)
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async incrementField(
    userId: string,
    eventId: string,
    field: string,
    amount: number = 1,
  ): Promise<UserActivityDocument | null> {
    try {
      return this.userActivityModel
        .findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
            eventId: new Types.ObjectId(eventId),
          },
          {
            $inc: { [field]: amount },
            $set: { lastUpdatedAt: new Date() },
          },
          { new: true },
        )
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }
}
