import { Test, TestingModule } from '@nestjs/testing';
import { RewardRequestService } from './reward-request.service';
import { EventRepository } from '@event-microservice/infrastructure/repositories/event.repository';
import { UserActivityRepository } from '@event-microservice/infrastructure/repositories/user-activity.repository';
import { RewardRequestRepository } from '@event-microservice/infrastructure/repositories/reward-request.repository';
import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import { RewardRequestStatus } from '@api-contracts/enums/event/reward-request-status.enum';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';
import { RewardType } from '@api-contracts/enums/event/reward-type.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import { EventErrorCode } from '@event-microservice/shared/exceptions/event-error-code.enum';
import { Types } from 'mongoose';
import { TransactionHelper } from '@event-microservice/shared/helper/transaction.helper';

describe('RewardRequestService', () => {
  let service: RewardRequestService;
  let eventRepository: EventRepository;
  let userActivityRepository: UserActivityRepository;
  let rewardRequestRepository: RewardRequestRepository;
  let tx: TransactionHelper;

  const mockEventRepository = {
    findById: jest.fn(),
  };

  const mockUserActivityRepository = {
    findByUserId: jest.fn(),
  };

  const mockRewardRequestRepository = {
    findByUserId: jest.fn(),
    findPreviousSuccess: jest.fn(),
    create: jest.fn(),
  };

  const mockTransactionHelper = {
    transact: jest.fn((callback) => callback({})),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardRequestService,
        {
          provide: EventRepository,
          useValue: mockEventRepository,
        },
        {
          provide: UserActivityRepository,
          useValue: mockUserActivityRepository,
        },
        {
          provide: RewardRequestRepository,
          useValue: mockRewardRequestRepository,
        },
        {
          provide: TransactionHelper,
          useValue: mockTransactionHelper,
        },
      ],
    }).compile();

    service = module.get<RewardRequestService>(RewardRequestService);
    eventRepository = module.get<EventRepository>(EventRepository);
    userActivityRepository = module.get<UserActivityRepository>(
      UserActivityRepository,
    );
    rewardRequestRepository = module.get<RewardRequestRepository>(
      RewardRequestRepository,
    );
    tx = module.get<TransactionHelper>(TransactionHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRewardRequest', () => {
    const mockEventId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId().toString();
    const mockRuleId = new Types.ObjectId().toString();

    it('보상 지급 요청을 성공적으로 생성한다', async () => {
      // Given
      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        status: EventStatus.ACTIVE,
        startedAt: new Date(Date.now() + 86400000), // 내일
        endedAt: new Date(Date.now() + 86400000 * 2), // 모레
        autoReward: true,
        rewardRules: [
          {
            _id: new Types.ObjectId(mockRuleId),
            ruleType: RewardRuleType.PER_CONDITION,
            config: {
              metric: 'loginStreak',
              perThreshold: 1,
            },
            rewardItems: [
              {
                type: RewardType.CASH,
                amount: 1000,
              },
            ],
          },
        ],
      };

      const mockUserActivity = {
        loginStreak: 3,
        inviteCount: 0,
        purchaseTotal: 0,
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockUserActivityRepository.findByUserId.mockResolvedValue(
        mockUserActivity,
      );
      mockRewardRequestRepository.findByUserId.mockResolvedValue([]);
      mockRewardRequestRepository.findPreviousSuccess.mockResolvedValue([]);
      mockRewardRequestRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        eventId: new Types.ObjectId(mockEventId),
        userId: new Types.ObjectId(mockUserId),
        ruleIds: [new Types.ObjectId(mockRuleId)],
        rewards: [
          {
            type: RewardType.CASH,
            amount: 1000,
          },
        ],
        status: RewardRequestStatus.SUCCESS,
        requestedAt: new Date(),
        conditionMet: true,
      });

      // When
      const result = await service.createRewardRequest(mockEventId, {
        userId: mockUserId,
      });

      // Then
      expect(result).toBeDefined();
      expect(result.status).toBe(RewardRequestStatus.SUCCESS);
      expect(result.conditionMet).toBe(true);
      expect(result.rewards).toHaveLength(1);
      expect(result.rewards[0].type).toBe(RewardType.CASH);
      expect(result.rewards[0].amount).toBe(1000);
      expect(mockRewardRequestRepository.create).toHaveBeenCalled();
    });

    it('이벤트가 활성화 상태가 아니면 예외를 발생시킨다', async () => {
      // Given
      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        status: EventStatus.INACTIVE,
        startedAt: new Date(Date.now() + 86400000), // 내일
        endedAt: new Date(Date.now() + 86400000 * 2), // 모레
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      // When & Then
      await expect(
        service.createRewardRequest(mockEventId, { userId: mockUserId }),
      ).rejects.toThrow(EventException);
      await expect(
        service.createRewardRequest(mockEventId, { userId: mockUserId }),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.EVENT_INACTIVE,
      });
    });

    it('이벤트 기간이 유효하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        status: EventStatus.ACTIVE,
        startedAt: new Date(Date.now() - 86400000), // 어제
        endedAt: new Date(Date.now() + 172800000), // 모레
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      // When & Then
      await expect(
        service.createRewardRequest(mockEventId, { userId: mockUserId }),
      ).rejects.toThrow(EventException);
      await expect(
        service.createRewardRequest(mockEventId, { userId: mockUserId }),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.INVALID_EVENT_PERIOD,
      });
    });

    it('보상 조건을 달성하지 못하면 실패 상태로 요청을 생성한다', async () => {
      // Given
      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        status: EventStatus.ACTIVE,
        startedAt: new Date(Date.now() + 86400000), // 내일
        endedAt: new Date(Date.now() + 86400000 * 2), // 모레
        autoReward: true,
        rewardRules: [
          {
            _id: new Types.ObjectId(mockRuleId),
            ruleType: RewardRuleType.PER_CONDITION,
            config: {
              metric: 'loginStreak',
              perThreshold: 5, // 5일 로그인 필요
            },
            rewardItems: [
              {
                type: RewardType.CASH,
                amount: 1000,
              },
            ],
          },
        ],
      };

      const mockUserActivity = {
        loginStreak: 3, // 3일만 로그인
        inviteCount: 0,
        purchaseTotal: 0,
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockUserActivityRepository.findByUserId.mockResolvedValue(
        mockUserActivity,
      );
      mockRewardRequestRepository.findByUserId.mockResolvedValue([]);
      mockRewardRequestRepository.findPreviousSuccess.mockResolvedValue([]);
      mockRewardRequestRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        eventId: new Types.ObjectId(mockEventId),
        userId: new Types.ObjectId(mockUserId),
        ruleIds: [],
        rewards: [],
        status: RewardRequestStatus.FAILED,
        requestedAt: new Date(),
        conditionMet: false,
      });

      // When
      const result = await service.createRewardRequest(mockEventId, {
        userId: mockUserId,
      });

      // Then
      expect(result).toBeDefined();
      expect(result.status).toBe(RewardRequestStatus.FAILED);
      expect(result.conditionMet).toBe(false);
      expect(result.rewards).toHaveLength(0);
    });
  });
});
