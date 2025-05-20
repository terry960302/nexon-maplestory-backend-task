import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, INestMicroservice } from '@nestjs/common';
import {
  ClientProxy,
  ClientsModule,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { EventModule } from '@event-microservice/event.module';
import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';
import { Connection, Types } from 'mongoose';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { firstValueFrom } from 'rxjs';
import { getConnectionToken } from '@nestjs/mongoose';
import { EventErrorCode } from '@event-microservice/shared/exceptions/event-error-code.enum';
import { RewardAddRequestDto } from '@api-contracts/dto/reward/reward-add-request.dto';
import { UserActivityCreateRequestDto } from '@api-contracts/dto/user-activity/user-activity-create-request.dto';
import { UserActivityDto } from '@api-contracts/dto/user-activity/user-activity.dto';
import { GlobalRpcExceptionFilter } from '@api-contracts/filters/global-rpc-exception.filter';
import { RewardType } from '@api-contracts/enums/event/reward-type.enum';

const SERVICE_EVENT = 'EVENT_SERVICE';
const PORT = 3001;

describe('이벤트 마이크로서비스 통합 테스크', () => {
  let app: INestApplication;
  let client: ClientProxy;
  let createdEventId: string;
  let dbConnection: Connection;
  let eventRpc: INestMicroservice;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        EventModule,
        ClientsModule.register([
          {
            name: SERVICE_EVENT,
            transport: Transport.TCP,
            options: {
              host: 'localhost',
              port: PORT,
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    eventRpc = app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: { host: 'localhost', port: PORT },
    });

    // 2) 해당 인스턴스에 글로벌 필터 등록
    eventRpc.useGlobalFilters(new GlobalRpcExceptionFilter());

    await app.startAllMicroservices();

    await app.init();

    client = app.get<ClientProxy>(SERVICE_EVENT);

    // MongoDB 연결 상태 확인
    dbConnection = moduleFixture.get<Connection>(getConnectionToken());
    console.log('MongoDB connection state:', dbConnection.readyState);

    await client.connect();
  });

  afterAll(async () => {
    await client?.close();
    await app?.close();
    await eventRpc?.close();
    await dbConnection?.close();
  });

  beforeEach(async () => {
    await dbConnection.collection('reward_requests').deleteMany({});
  });

  describe('이벤트 생성', () => {
    it('새로운 이벤트를 생성한다', async () => {
      const createEventDto = {
        name: '테스트 이벤트' + new Date().toISOString(),
        startedAt: new Date(Date.now() + 86400000).toISOString(), // 내일
        endedAt: new Date(Date.now() + 86400000 * 2).toISOString(), // 모레
        autoReward: true,
      };

      const response = await firstValueFrom(
        client.send(MessagePatterns.EVENTS_CREATE, createEventDto),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('id');
      expect(response.name).toBe(createEventDto.name);
      expect(response.status).toBe(EventStatus.INACTIVE);
      createdEventId = response.id;
    });

    it('이벤트 기간이 유효하지 않으면 에러를 반환한다', async () => {
      const invalidEventDto = {
        name: '잘못된 기간 이벤트' + new Date().toISOString(),
        startedAt: new Date(Date.now() + 86400000).toISOString(), // 내일
        endedAt: new Date(Date.now() - 86400000).toISOString(), // 어제
        autoReward: true,
      };

      await expect(
        firstValueFrom(
          client.send(MessagePatterns.EVENTS_CREATE, invalidEventDto),
        ),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.INVALID_EVENT_PERIOD,
      });
    });

    it('이름이 중복된 이벤트 생성 시 에러 반환', async () => {
      const name = '중복 이벤트 테스트' + new Date().toISOString();
      const duplicateDto = {
        name: name,
        startedAt: new Date(Date.now() + 86400000).toISOString(),
        endedAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        autoReward: true,
      };

      // 첫 번째 생성(성공)
      await firstValueFrom(
        client.send(MessagePatterns.EVENTS_CREATE, duplicateDto),
      );

      // 두 번째 생성(중복) → 에러
      await expect(
        firstValueFrom(
          client.send(MessagePatterns.EVENTS_CREATE, duplicateDto),
        ),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.DUPLICATED_EVENT,
      });
    });
  });

  describe('이벤트 조회', () => {
    it('이벤트 ID로 이벤트를 조회한다', async () => {
      const response = await firstValueFrom(
        client.send(MessagePatterns.EVENTS_GET, { eventId: createdEventId }),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('id', createdEventId);
      expect(response).toHaveProperty('rewardRules');
    });

    it('존재하지 않는 이벤트 ID로 조회하면 에러를 반환한다', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await expect(
        firstValueFrom(
          client.send(MessagePatterns.EVENTS_GET, { eventId: nonExistentId }),
        ),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.EVENT_NOT_FOUND,
      });
    });

    it('이벤트 목록을 페이지네이션으로 조회한다', async () => {
      const response = await firstValueFrom(
        client.send(MessagePatterns.EVENTS_LIST, {
          page: 0,
          pageSize: 10,
          sortBy: '-startedAt',
        }),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('page');
      expect(response).toHaveProperty('pageSize');
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('보상 규칙 추가', () => {
    it('이벤트에 보상 규칙을 추가한다', async () => {
      const addRewardDto: RewardAddRequestDto = {
        eventId: createdEventId,
        ruleOptions: {
          // 기존 Rule에 보상을 추가하고자 할때
          // 새로운 Rule에 보상을 추가하고자 할때
          newRule: {
            ruleType: RewardRuleType.PER_CONDITION,
            config: {
              metric: 'loginStreak',
              perThreshold: 3,
            },
          },
        },
        rewardItem: {
          // ruleId 가 없기 때문에 새로운 규칙이 생성됨
          type: RewardType.CASH,
          amount: 1000,
        },
      };

      const response = await firstValueFrom(
        client.send(MessagePatterns.REWARDS_ADD, addRewardDto),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('id');
      expect(response.ruleType).toBe(RewardRuleType.PER_CONDITION);
    });
  });

  describe('이벤트 상태 수정', () => {
    it('이벤트 상태를 수정한다', async () => {
      const updateEventDto = {
        eventId: createdEventId,
        status: EventStatus.ACTIVE,
      };

      const response = await firstValueFrom(
        client.send(MessagePatterns.EVENTS_UPDATE, updateEventDto),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('id', createdEventId);
      expect(response.status).toBe(EventStatus.ACTIVE);
    });

    it('알 수 없는 상태 값으로 수정 시 에러 반환', async () => {
      await expect(
        firstValueFrom(
          client.send(MessagePatterns.EVENTS_UPDATE, {
            eventId: createdEventId,
            status: 'UNKNOWN_STATUS' as any,
          }),
        ),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.INVALID_EVENT_STATUS,
      });
    });
  });

  describe('보상 지급 요청', () => {
    const userId = new Types.ObjectId().toString();

    it('사용자 활동을 임시로 생성한다.', async () => {
      const createUserActivityDto: UserActivityCreateRequestDto = {
        userId: userId,
        loginStreak: 1,
        inviteCount: 1,
        purchaseTotal: 1000,
      };

      const response: UserActivityDto = await firstValueFrom(
        client.send(
          MessagePatterns.USER_ACTIVITY_CREATE,
          createUserActivityDto,
        ),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('userId', createUserActivityDto.userId);
      expect(response).toHaveProperty(
        'loginStreak',
        createUserActivityDto.loginStreak,
      );
      expect(response).toHaveProperty(
        'inviteCount',
        createUserActivityDto.inviteCount,
      );
      expect(response).toHaveProperty(
        'purchaseTotal',
        createUserActivityDto.purchaseTotal,
      );
    });

    it('보상 지급 요청을 생성한다', async () => {
      const createRewardRequestDto = {
        eventId: createdEventId,
        dto: {
          userId: userId,
        },
      };

      const response = await firstValueFrom(
        client.send(
          MessagePatterns.REWARD_REQUESTS_CREATE,
          createRewardRequestDto,
        ),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('conditionMet');
    });

    // const unmetUserId = new Types.ObjectId().toString();

    it('조건을 충족하지 않은 유저는 conditionMet=false 응답', async () => {
      const dto = {
        eventId: createdEventId,
        dto: { userId: userId },
      };

      const response = await firstValueFrom(
        client.send(MessagePatterns.REWARD_REQUESTS_CREATE, dto),
      );

      expect(response).toHaveProperty('conditionMet', false);
      expect(response).toHaveProperty('status'); // 필요 시 정확한 실패 상태도 체크
    });

    it('보상 지급 요청 목록을 조회한다', async () => {
      const response = await firstValueFrom(
        client.send(MessagePatterns.REWARD_REQUESTS_EVENT_LIST, {
          eventId: createdEventId,
          page: 0,
          pageSize: 10,
          sortBy: '-requestedAt',
        }),
      );

      expect(response).toBeDefined();
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('total');
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
