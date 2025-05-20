import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { SERVICE_EVENT } from '@gateway/shared/constants/service-names';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RewardDto } from '@api-contracts/dto/reward/reward.dto';
import { RewardCreateRequestDto } from '@api-contracts/dto/reward/reward-create-request.dto';
import { RewardListResponseDto } from '@api-contracts/dto/reward/reward-list-response.dto';
import { JwtAuthGuard } from '@gateway/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@gateway/shared/guards/roles.guard';
import { Roles } from '@gateway/shared/decorators/roles.decorator';
import { Role } from '@api-contracts/enums/auth/role.enum';

@Controller('v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RewardClientController {
  constructor(
    @Inject(SERVICE_EVENT) private readonly eventClient: ClientProxy,
  ) {}

  @Get()
  @Roles(Role.OPERATOR, Role.ADMIN)
  async findAll(
    @Param('eventId') eventId: string,
  ): Promise<RewardListResponseDto> {
    const response$ = this.eventClient.send<RewardListResponseDto>(
      MessagePatterns.REWARDS_LIST,
      eventId,
    );
    return firstValueFrom(response$);
  }

  @Post()
  @Roles(Role.OPERATOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: RewardCreateRequestDto,
  ): Promise<RewardDto> {
    const response$ = this.eventClient.send<RewardDto>(
      MessagePatterns.REWARDS_ADD,
      { eventId, ...dto },
    );
    return firstValueFrom(response$);
  }
}
