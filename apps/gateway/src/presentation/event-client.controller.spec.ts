import { Test, TestingModule } from '@nestjs/testing';
import { EventClientController } from './event-client.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { EventParamDto } from '@api-contracts/dto/event/event-param.dto';
import { SERVICE_EVENT } from '@gateway/shared/constants/service-names';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { EventGetQueryDto } from '@api-contracts/dto/event/event-get-query.dto';
import { EventCreateRequestDto } from '@api-contracts/dto/event/event-create-request.dto';

describe('EventClientController', () => {
  let controller: EventClientController;
  let eventClient: ClientProxy;

  const mockEventClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventClientController],
      providers: [
        {
          provide: SERVICE_EVENT,
          useValue: mockEventClient,
        },
      ],
    }).compile();

    controller = module.get<EventClientController>(EventClientController);
    eventClient = module.get<ClientProxy>(SERVICE_EVENT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const mockQuery: EventGetQueryDto = {
      active: true,
      page: 1,
      pageSize: 10,
    };

    const mockResponse = {
      data: [
        {
          id: '1',
          title: 'Test Event',
          description: 'Test Description',
        },
      ],
    };

    it('should successfully send findAll request to event service', async () => {
      // Given
      mockEventClient.send.mockReturnValue(of(mockResponse));

      // When
      const result = await controller.findAll(mockQuery);

      // Then
      expect(mockEventClient.send).toHaveBeenCalledWith(
        MessagePatterns.EVENTS_LIST,
        mockQuery,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle event service connection error', async () => {
      // Given
      const error = new Error('Connection refused');
      mockEventClient.send.mockReturnValue(throwError(() => error));

      // When & Then
      await expect(controller.findAll(mockQuery)).rejects.toThrow(
        'Connection refused',
      );
      expect(mockEventClient.send).toHaveBeenCalledWith(
        MessagePatterns.EVENTS_LIST,
        mockQuery,
      );
    });
  });

  describe('findOne', () => {
    const mockParams: EventParamDto = {
      eventId: '1',
    };

    const mockResponse = {
      id: '1',
      title: 'Test Event',
      description: 'Test Description',
    };

    it('should successfully send findOne request to event service', async () => {
      // Given
      mockEventClient.send.mockReturnValue(of(mockResponse));

      // When
      const result = await controller.findOne(mockParams);

      // Then
      expect(mockEventClient.send).toHaveBeenCalledWith(
        MessagePatterns.EVENTS_GET,
        mockParams.eventId,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle event service connection error', async () => {
      // Given
      const error = new Error('Connection refused');
      mockEventClient.send.mockReturnValue(throwError(() => error));

      // When & Then
      await expect(controller.findOne(mockParams)).rejects.toThrow(
        'Connection refused',
      );
      expect(mockEventClient.send).toHaveBeenCalledWith(
        MessagePatterns.EVENTS_GET,
        mockParams.eventId,
      );
    });
  });

  describe('create', () => {
    const mockCreateEventDto: EventCreateRequestDto = {
      name: '프로모션1',
      startedAt: Date.now().toLocaleString(),
      endedAt: Date.now().toLocaleString(),
    };

    const mockResponse = {
      id: '1',
      title: 'Test Event',
      description: 'Test Description',
    };

    it('should successfully send create request to event service', async () => {
      // Given
      mockEventClient.send.mockReturnValue(of(mockResponse));

      // When
      const result = await controller.create(mockCreateEventDto);

      // Then
      expect(mockEventClient.send).toHaveBeenCalledWith(
        MessagePatterns.EVENTS_CREATE,
        mockCreateEventDto,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle event service connection error', async () => {
      // Given
      const error = new Error('Connection refused');
      mockEventClient.send.mockReturnValue(throwError(() => error));

      // When & Then
      await expect(controller.create(mockCreateEventDto)).rejects.toThrow(
        'Connection refused',
      );
      expect(mockEventClient.send).toHaveBeenCalledWith(
        MessagePatterns.EVENTS_CREATE,
        mockCreateEventDto,
      );
    });
  });
});
