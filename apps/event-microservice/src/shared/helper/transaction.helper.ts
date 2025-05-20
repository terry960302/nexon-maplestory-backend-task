import { DatabaseRpcException } from '@api-contracts/exceptions/database-rpc.exception';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class TransactionHelper {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async transact<T>(
    work: (session: ClientSession) => Promise<T>,
    opts?: { maxCommitTimeMS?: number },
  ): Promise<T> {
    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(() => work(session), opts);
    } catch (err) {
      throw new DatabaseRpcException(err);
    } finally {
      session.endSession();
    }
  }
}
