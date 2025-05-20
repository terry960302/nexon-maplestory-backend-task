import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { EventRepository } from '@event-microservice/infrastructure/repositories/event.repository';
import { EventStatus } from '@api-contracts/enums/event/event-status.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import { EventErrorCode } from '@event-microservice/shared/exceptions/event-error-code.enum';
import { EventCreateRequestDto } from '@api-contracts/dto/event/event-create-request.dto';
import { EventGetQueryDto } from '@api-contracts/dto/event/event-get-query.dto';
import { EventParamDto } from '@api-contracts/dto/event/event-param.dto';
import { Types } from 'mongoose';

describe('EventService', () => {
  let service: EventService;
  let repository: EventRepository;

  const mockEventRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: EventRepository,
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    repository = module.get<EventRepository>(EventRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('이벤트 목록을 성공적으로 조회한다', async () => {
      // Given
      const mockEvents = [
        {
          _id: new Types.ObjectId(),
          name: '테스트 이벤트 1',
          startedAt: new Date(),
          endedAt: new Date(),
          status: EventStatus.ACTIVE,
        },
      ];

      const filter: EventGetQueryDto = {
        page: 1,
        pageSize: 10,
        sortBy: 'startedAt',
        active: true,
      };

      mockEventRepository.findAll.mockResolvedValue(mockEvents);
      mockEventRepository.count.mockResolvedValue(1);

      // When
      const result = await service.findAll(filter);

      // Then
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(filter.page);
      expect(result.pageSize).toBe(filter.pageSize);
      expect(mockEventRepository.findAll).toHaveBeenCalledWith(
        filter.active,
        filter.sortBy,
        filter.page,
        filter.pageSize,
      );
    });
  });

  describe('findById', () => {
    it('존재하는 이벤트를 성공적으로 조회한다', async () => {
      // Given
      const mockEvent = {
        _id: new Types.ObjectId(),
        name: '테스트 이벤트',
        startedAt: new Date(),
        endedAt: new Date(),
        status: EventStatus.ACTIVE,
        rewardRules: [],
      };

      const param: EventParamDto = {
        eventId: mockEvent._id.toString(),
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      // When
      const result = await service.findById(param);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBe(mockEvent._id.toString());
      expect(mockEventRepository.findById).toHaveBeenCalledWith(param.eventId);
    });

    it('존재하지 않는 이벤트 조회 시 예외를 발생시킨다', async () => {
      // Given
      const param: EventParamDto = {
        eventId: new Types.ObjectId().toString(),
      };

      mockEventRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.findById(param)).rejects.toThrow(EventException);
      await expect(service.findById(param)).rejects.toMatchObject({
        errorCode: EventErrorCode.EVENT_NOT_FOUND,
      });
    });
  });

  describe('create', () => {
    it('새로운 이벤트를 성공적으로 생성한다', async () => {
      // Given
      const createDto: EventCreateRequestDto = {
        name: '새 이벤트',
        startedAt: new Date(Date.now() + 86400000).toISOString(), // 내일
        endedAt: new Date(Date.now() + 172800000).toISOString(), // 모레
      };

      const mockCreatedEvent = {
        _id: new Types.ObjectId(),
        ...createDto,
        startedAt: new Date(createDto.startedAt),
        endedAt: new Date(createDto.endedAt),
        status: EventStatus.INACTIVE,
        rewardRules: [],
      };

      mockEventRepository.create.mockResolvedValue(mockCreatedEvent);

      // When
      const result = await service.create(createDto);

      // Then
      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.status).toBe(EventStatus.INACTIVE);
      expect(mockEventRepository.create).toHaveBeenCalled();
    });

    it('유효하지 않은 이벤트 기간으로 생성 시 예외를 발생시킨다', async () => {
      // Given
      const createDto: EventCreateRequestDto = {
        name: '잘못된 이벤트',
        startedAt: new Date(Date.now() + 172800000).toISOString(), // 모레
        endedAt: new Date(Date.now() + 86400000).toISOString(), // 내일
      };

      // When & Then
      await expect(service.create(createDto)).rejects.toThrow(EventException);
    });
  });

  describe('updateStatus', () => {
    it('이벤트 상태를 성공적으로 업데이트한다', async () => {
      // Given
      const eventId = new Types.ObjectId().toString();
      const newStatus = EventStatus.ACTIVE;

      const mockEvent = {
        _id: new Types.ObjectId(eventId),
        name: '테스트 이벤트',
        startedAt: new Date(),
        endedAt: new Date(),
        status: EventStatus.INACTIVE,
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.updateStatus.mockResolvedValue({
        ...mockEvent,
        status: newStatus,
      });

      // When
      const result = await service.updateStatus({ eventId, status: newStatus });

      // Then
      expect(result.status).toBe(newStatus);
      expect(mockEventRepository.updateStatus).toHaveBeenCalledWith(
        eventId,
        newStatus,
      );
    });

    it('존재하지 않는 이벤트 상태 업데이트 시 예외를 발생시킨다', async () => {
      // Given
      const eventId = new Types.ObjectId().toString();
      const newStatus = EventStatus.ACTIVE;

      mockEventRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(
        service.updateStatus({ eventId, status: newStatus }),
      ).rejects.toThrow(EventException);
      await expect(
        service.updateStatus({ eventId, status: newStatus }),
      ).rejects.toMatchObject({
        errorCode: EventErrorCode.EVENT_NOT_FOUND,
      });
    });
  });
});
