import { Test, TestingModule } from '@nestjs/testing';
import { RewardService } from './reward.service';
import { EventRepository } from '@event-microservice/infrastructure/repositories/event.repository';
import { TransactionHelper } from '@event-microservice/shared/helper/transaction.helper';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';
import { RewardType } from '@api-contracts/enums/event/reward-type.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import { EventErrorCode } from '@event-microservice/shared/exceptions/event-error-code.enum';
import { Types } from 'mongoose';
import { ClientSession } from 'mongoose';

describe('RewardService', () => {
  let service: RewardService;
  let eventRepository: EventRepository;
  let txHelper: TransactionHelper;

  const mockEventRepository = {
    findById: jest.fn(),
    upsert: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockTxHelper = {
    transact: jest.fn((callback) => callback(mockSession)),
  };

  const mockSession = {} as ClientSession;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: EventRepository,
          useValue: mockEventRepository,
        },
        {
          provide: TransactionHelper,
          useValue: mockTxHelper,
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
    eventRepository = module.get<EventRepository>(EventRepository);
    txHelper = module.get<TransactionHelper>(TransactionHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEventId', () => {
    const mockEventId = new Types.ObjectId().toString();

    it('이벤트의 모든 보상 규칙을 조회한다', async () => {
      // Given
      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        rewardRules: [
          {
            _id: new Types.ObjectId(),
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

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      // When
      const result = await service.findByEventId({ eventId: mockEventId });

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].ruleType).toBe(RewardRuleType.PER_CONDITION);
      expect(mockEventRepository.findById).toHaveBeenCalledWith(mockEventId);
    });

    it('존재하지 않는 이벤트 조회 시 예외를 발생시킨다', async () => {
      // Given
      mockEventRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(
        service.findByEventId({ eventId: mockEventId }),
      ).rejects.toThrow(EventException);
      await expect(
        service.findByEventId({ eventId: mockEventId }),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.EVENT_NOT_FOUND,
      });
    });
  });

  describe('addReward', () => {
    const mockEventId = new Types.ObjectId().toString();
    const mockRuleId = new Types.ObjectId().toString();

    it('기존 규칙에 보상을 추가한다', async () => {
      // Given
      const requestDto = {
        eventId: mockEventId,
        rewardItem: {
          type: RewardType.CASH,
          amount: 1000,
        },
        ruleOptions: {
          ruleId: mockRuleId,
        },
      };

      const mockUpdatedEvent = {
        _id: new Types.ObjectId(mockEventId),
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

      mockEventRepository.findById.mockResolvedValue(mockUpdatedEvent);
      mockEventRepository.findByIdAndUpdate.mockResolvedValue(mockUpdatedEvent);

      // When
      const result = await service.addReward(requestDto);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBe(mockRuleId);
      expect(result.rewardItems).toHaveLength(1);
      expect(mockTxHelper.transact).toHaveBeenCalled();
      expect(mockEventRepository.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEventId,
        mockRuleId,
        requestDto.rewardItem,
        mockSession,
      );
    });

    it('새로운 규칙을 생성하고 보상을 추가한다', async () => {
      // Given
      const requestDto = {
        eventId: mockEventId,
        rewardItem: {
          type: RewardType.CASH,
          amount: 1000,
        },
        ruleOptions: {
          newRule: {
            ruleType: RewardRuleType.PER_CONDITION,
            config: {
              metric: 'loginStreak',
              perThreshold: 1,
            },
          },
        },
      };

      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        rewardRules: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.upsert.mockResolvedValue(mockEvent);

      // When
      const result = await service.addReward(requestDto);

      // Then
      expect(result).toBeDefined();
      expect(result.ruleType).toBe(RewardRuleType.PER_CONDITION);
      expect(result.rewardItems).toHaveLength(1);
    });

    it('유효하지 않은 규칙 설정으로 보상 추가 시 예외를 발생시킨다', async () => {
      // Given
      const requestDto = {
        eventId: mockEventId,
        rewardItem: {
          type: RewardType.CASH,
          amount: 1000,
        },
        ruleOptions: {
          newRule: {
            ruleType: RewardRuleType.PER_CONDITION,
            config: {
              // 잘못된 설정
              metrics: 'invalid',
              perThreshold: -1,
              greaterThan: true,
            },
          },
        },
      };

      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        rewardRules: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      // When & Then
      await expect(service.addReward(requestDto)).rejects.toThrow(
        EventException,
      );
      await expect(service.addReward(requestDto)).rejects.toMatchObject({
        errorCode: EventErrorCode.INVALID_RULE_CONFIG,
      });
    });

    it('지원하지 않는 규칙 타입으로 보상 추가 시 예외를 발생시킨다', async () => {
      // Given
      const requestDto = {
        eventId: mockEventId,
        rewardItem: {
          type: RewardType.CASH,
          amount: 1000,
        },
        ruleOptions: {
          newRule: {
            ruleType: 'INVALID_TYPE' as RewardRuleType,
            config: {
              metric: 'loginStreak',
              perThreshold: 1,
            },
          },
        },
      };

      const mockEvent = {
        _id: new Types.ObjectId(mockEventId),
        rewardRules: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      // When & Then
      await expect(service.addReward(requestDto)).rejects.toThrow(
        EventException,
      );
      await expect(service.addReward(requestDto)).rejects.toMatchObject({
        errorCode: EventErrorCode.UNSUPPORTED_RULE_TYPE,
      });
    });
  });
});
