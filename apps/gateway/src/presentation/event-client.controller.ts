import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventParamDto } from '@api-contracts/dto/event/event-param.dto';
import { EventDto } from '@api-contracts/dto/event/event.dto';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { SERVICE_EVENT } from '@gateway/shared/constants/service-names';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '@gateway/shared/guards/jwt-auth.guard';
import { Roles } from '@gateway/shared/decorators/roles.decorator';
import { RolesGuard } from '@gateway/shared/guards/roles.guard';
import { Role } from '@api-contracts/enums/auth/role.enum';
import { EventGetQueryDto } from '@api-contracts/dto/event/event-get-query.dto';
import { EventCreateRequestDto } from '@api-contracts/dto/event/event-create-request.dto';
import { EventDetailsDto } from '@api-contracts/dto/event/event-details.dto';

@Controller('v1/events')
export class EventClientController {
  constructor(
    @Inject(SERVICE_EVENT) private readonly eventClient: ClientProxy,
  ) {}

  // 이벤트 목록 조회
  @Get()
  async findAll(
    @Query() queryParams: EventGetQueryDto,
  ): Promise<{ data: EventDto[] }> {
    const response$ = this.eventClient.send<{ data: EventDto[] }>(
      MessagePatterns.EVENTS_LIST,
      queryParams,
    );
    return firstValueFrom(response$);
  }

  // 이벤트 상세 조회
  @Get(':id')
  async findOne(@Param() params: EventParamDto): Promise<EventDetailsDto> {
    const response$ = this.eventClient.send<EventDetailsDto>(
      MessagePatterns.EVENTS_GET,
      params.eventId,
    );
    return firstValueFrom(response$);
  }

  // 이벤트 등록
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() request: EventCreateRequestDto): Promise<EventDto> {
    const response$ = this.eventClient.send<EventDto>(
      MessagePatterns.EVENTS_CREATE,
      request,
    );
    return firstValueFrom(response$);
  }
}
