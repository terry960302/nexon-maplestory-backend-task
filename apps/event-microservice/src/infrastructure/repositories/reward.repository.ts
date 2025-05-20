import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RewardType } from '@api-contracts/enums/event/reward-type.enum';
import {
  RewardItem,
  RewardItemDocument,
} from '@event-microservice/infrastructure/schemas/reward-item.schema';
import { DatabaseRpcException } from '@api-contracts/exceptions/database-rpc.exception';

@Injectable()
export class RewardRepository {
  constructor(
    @InjectModel(RewardItem.name)
    private rewardItemModel: Model<RewardItemDocument>,
  ) {}

  async findByEventId(eventId: string): Promise<RewardItemDocument[]> {
    try {
      return this.rewardItemModel
        .find({ eventId: new Types.ObjectId(eventId) })
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async create(rewardData: {
    eventId: string;
    type: RewardType;
    amount: number;
  }): Promise<RewardItemDocument> {
    try {
      const createdReward = new this.rewardItemModel({
        ...rewardData,
        eventId: new Types.ObjectId(rewardData.eventId),
      });
      return createdReward.save();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async deleteByEventId(eventId: string): Promise<void> {
    try {
      await this.rewardItemModel
        .deleteMany({ eventId: new Types.ObjectId(eventId) })
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }
}
