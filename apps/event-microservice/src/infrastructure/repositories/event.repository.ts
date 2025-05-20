import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  Event,
  EventDocument,
} from '@event-microservice/infrastructure/schemas/event.schema';
import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';
import { DatabaseRpcException } from '@api-contracts/exceptions/database-rpc.exception';

@Injectable()
export class EventRepository {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async findAll(
    active?: boolean,
    sortBy?: string,
    page?: number,
    limit?: number,
  ): Promise<EventDocument[]> {
    try {
      const query = active !== undefined ? { status: EventStatus.ACTIVE } : {};
      return this.eventModel
        .find(query)
        .sort(sortBy)
        .skip(page * limit)
        .limit(limit)
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async count(filter: any) {
    return this.eventModel.countDocuments(filter).exec();
  }

  async upsert(
    event: EventDocument,
    session?: ClientSession,
  ): Promise<EventDocument> {
    try {
      return event.save({ session });
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<EventDocument | null> {
    try {
      return this.eventModel
        .findById(new Types.ObjectId(id))
        .session(session)
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async findByName(name: string): Promise<EventDocument | null> {
    try {
      return this.eventModel.findOne({ name }).exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async create(eventData: Partial<Event>): Promise<EventDocument> {
    try {
      const createdEvent = new this.eventModel(eventData);
      return createdEvent.save();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async updateStatus(
    id: string,
    status: EventStatus,
  ): Promise<EventDocument | null> {
    try {
      return this.eventModel
        .findByIdAndUpdate(new Types.ObjectId(id), { status }, { new: true })
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async findByIdAndUpdate(
    id: string,
    ruleId: string,
    rewardItem: RewardItem,
    session?: ClientSession,
  ): Promise<EventDocument | null> {
    try {
      return this.eventModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            'rewardRules._id': new Types.ObjectId(ruleId),
          },
          { $push: { 'rewardRules.$.rewardItems': rewardItem } },
          { new: true, session },
        )
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }
}
