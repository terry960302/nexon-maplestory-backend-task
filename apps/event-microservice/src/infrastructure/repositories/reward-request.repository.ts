import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import {
  RewardRequest,
  RewardRequestDocument,
} from '@event-microservice/infrastructure/schemas/reward-request.schema';
import { RewardRequestStatus } from '@api-contracts/enums/event/reward-request-status.enum';
import { RewardRequestGetQueryDto } from '@api-contracts/dto/reward-request/reward-request-get-query.dto';
import { PageableDto } from '@api-contracts/dto/common/pageable.dto';
import { DatabaseRpcException } from '@api-contracts/exceptions/database-rpc.exception';

@Injectable()
export class RewardRequestRepository {
  constructor(
    @InjectModel(RewardRequest.name)
    private readonly requestModel: Model<RewardRequestDocument>,
  ) {}

  async findPreviousSuccess(
    eventId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<RewardRequestDocument[]> {
    try {
      return this.requestModel
        .find({ eventId, userId, status: RewardRequestStatus.SUCCESS })
        .session(session)
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async create(
    rewardRequest: RewardRequest,
    session?: ClientSession,
  ): Promise<RewardRequestDocument> {
    try {
      const doc = new this.requestModel(rewardRequest);
      return doc.save({ session });
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async findByUser(
    userId: string,
    filter: PageableDto,
  ): Promise<RewardRequestDocument[]> {
    try {
      return this.requestModel
        .find({ userId })
        .sort(filter.sortBy)
        .skip(filter.page * filter.pageSize)
        .limit(filter.pageSize)
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<RewardRequestDocument | null> {
    try {
      return this.requestModel.findById(id).session(session).exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async findAll(filter: RewardRequestGetQueryDto) {
    try {
      return this.requestModel
        .find({
          userId: filter.userId,
          eventId: filter.eventId,
          status: filter.status,
        })
        .sort(filter.sortBy)
        .skip(filter.page)
        .limit(filter.pageSize)
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }

  async count(filter: RewardRequestGetQueryDto) {
    try {
      return this.requestModel
        .countDocuments({
          userId: filter.userId,
          eventId: filter.eventId,
          status: filter.status,
        })
        .exec();
    } catch (err) {
      throw new DatabaseRpcException(err);
    }
  }
}
