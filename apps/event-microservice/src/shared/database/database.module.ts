import dbConfig from '@event-microservice/shared/configs/db.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from '@event-microservice/infrastructure/schemas/event.schema';
import {
  RewardRequest,
  RewardRequestSchema,
} from '@event-microservice/infrastructure/schemas/reward-request.schema';
import {
  UserActivity,
  UserActivitySchema,
} from '@event-microservice/infrastructure/schemas/user-activity.schema';
import {
  RewardRule,
  RewardRuleSchema,
} from '@event-microservice/infrastructure/schemas/reward-rule.schema';
import {
  RewardItem,
  RewardItemSchema,
} from '@event-microservice/infrastructure/schemas/reward-item.schema';
import {
  PerConditionRule,
  PerConditionRuleSchema,
} from '@event-microservice/infrastructure/schemas/rules/per-condition-rule.schema';
import {
  StageRule,
  StageRuleSchema,
} from '@event-microservice/infrastructure/schemas/rules/stage-rule.schema';
import {
  FinalRule,
  FinalRuleSchema,
} from '@event-microservice/infrastructure/schemas/rules/final-rule.schema';
import { TransactionHelper } from '@event-microservice/shared/helper/transaction.helper';
@Module({
  imports: [
    ConfigModule.forFeature(dbConfig),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [dbConfig.KEY],
      useFactory: (config: ConfigType<typeof dbConfig>) => ({
        uri: config.uri,
        dbName: config.dbName,
        autoIndex: true,
        autoCreate: true,
      }),
    }),
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: RewardRule.name, schema: RewardRuleSchema },
      { name: PerConditionRule.name, schema: PerConditionRuleSchema },
      { name: StageRule.name, schema: StageRuleSchema },
      { name: FinalRule.name, schema: FinalRuleSchema },
      { name: RewardItem.name, schema: RewardItemSchema },
      { name: RewardRequest.name, schema: RewardRequestSchema },
      { name: UserActivity.name, schema: UserActivitySchema },
    ]),
  ],
  providers: [TransactionHelper],
  exports: [MongooseModule, TransactionHelper],
})
export class DatabaseModule {}
