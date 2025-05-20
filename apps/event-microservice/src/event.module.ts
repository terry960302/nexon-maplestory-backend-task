import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { validationSchema } from '@event-microservice/shared/configs/validation.schema';
import { DatabaseModule } from '@event-microservice/shared/database/database.module';
import dbConfig from '@event-microservice/shared/configs/db.config';
import appConfig from '@event-microservice/shared/configs/app.config';
import { EventRepository } from '@event-microservice/infrastructure/repositories/event.repository';
import { RewardRepository } from '@event-microservice/infrastructure/repositories/reward.repository';
import { RewardRequestRepository } from '@event-microservice/infrastructure/repositories/reward-request.repository';
import { UserActivityRepository } from '@event-microservice/infrastructure/repositories/user-activity.repository';
import { EventController } from '@event-microservice/presentation/event.controller';
import { RewardController } from '@event-microservice/presentation/reward.controller';
import { RewardRequestController } from '@event-microservice/presentation/reward-request.controller';
import { RewardRequestService } from '@event-microservice/application/services/reward-request.service';
import { EventService } from '@event-microservice/application/services/event.service';
import { RewardService } from '@event-microservice/application/services/reward.service';
import { TransactionHelper } from '@event-microservice/shared/helper/transaction.helper';
import { UserActivityController } from '@event-microservice/presentation/user-activity.controller';
import { UserActivityService } from '@event-microservice/application/services/user-activity.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig],
      envFilePath: [
        join(
          __dirname,
          '..',
          '..',
          '..',
          'env',
          process.env.NODE_ENV,
          '.env.event',
        ),
      ],
      validationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),
    DatabaseModule,
  ],
  providers: [
    TransactionHelper,
    EventRepository,
    RewardRepository,
    RewardRequestRepository,
    UserActivityRepository,
    RewardRequestService,
    EventService,
    RewardService,
    UserActivityService,
  ],
  controllers: [
    EventController,
    RewardController,
    RewardRequestController,
    UserActivityController,
  ],
})
export class EventModule {}
