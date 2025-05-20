import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
} from '@auth-microservice/infrastructure/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { DatabaseRpcException } from '@api-contracts/exceptions/database-rpc.exception';
@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  existsByEmail(email: string): Promise<boolean> {
    try {
      return this.userModel.exists({ email }).then((exists) => exists !== null);
    } catch (error) {
      throw new DatabaseRpcException(error);
    }
  }

  create(
    user: Partial<Omit<User, 'createdAt' | 'updatedAt'>>,
  ): Promise<UserDocument> {
    try {
      const created = new this.userModel(user);
      return created.save();
    } catch (error) {
      throw new DatabaseRpcException(error);
    }
  }

  findById(userId: Types.ObjectId): Promise<UserDocument | null> {
    try {
      return this.userModel.findById(userId).exec();
    } catch (error) {
      throw new DatabaseRpcException(error);
    }
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return this.userModel.findOne({ email }).exec();
    } catch (error) {
      throw new DatabaseRpcException(error);
    }
  }

  findOneByEmailAndPassword(
    email: string,
    passwordHash: string,
  ): Promise<UserDocument | null> {
    try {
      return this.userModel
        .findOne({ email: email, passwordHash: passwordHash })
        .exec();
    } catch (error) {
      throw new DatabaseRpcException(error);
    }
  }
}
