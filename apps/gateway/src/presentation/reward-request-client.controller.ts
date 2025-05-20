import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { Role } from '@api-contracts/enums/auth/role.enum';
import { SERVICE_EVENT } from '@gateway/shared/constants/service-names';
import { Roles } from '@gateway/shared/decorators/roles.decorator';
import { JwtAuthGuard } from '@gateway/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@gateway/shared/guards/roles.guard';
import {
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
import { firstValueFrom } from 'rxjs';
import { RewardRequestListResponseDto } from '@api-contracts/dto/reward-request/reward-request-list-response.dto';
import { RewardRequestDto } from '@api-contracts/dto/reward-request/reward-request.dto';
import { RewardRequestQueryDto } from '@api-contracts/dto/reward-request/reward-request-query.dto';
import { AuthenticatedUserDetails } from '@gateway/shared/interfaces/authenticated-user-details.interface';
import { AuthenticatedUser } from '@gateway/shared/decorators/authenticated-user.decorator';

@Controller('v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RewardRequestClientController {
  constructor(
    @Inject(SERVICE_EVENT) private readonly eventClient: ClientProxy,
  ) {}

  @Post('events/:eventId/reward-requests')
  @Roles(Role.USER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async requestReward(
    @Param('eventId') eventId: string,
    @AuthenticatedUser() userDetails: AuthenticatedUserDetails,
  ): Promise<RewardRequestDto> {
    const userId = userDetails.userId;
    const response$ = this.eventClient.send<RewardRequestDto>(
      MessagePatterns.REWARD_REQUESTS_CREATE,
      { eventId, userId },
    );
    return firstValueFrom(response$);
  }

  @Get('users/me/reward-requests')
  @Roles(Role.USER)
  async findMine(
    @AuthenticatedUser() userDetails: AuthenticatedUserDetails,
    @Query() queryParams: RewardRequestQueryDto,
  ): Promise<RewardRequestListResponseDto> {
    const response$ = this.eventClient.send<RewardRequestListResponseDto>(
      MessagePatterns.REWARD_REQUESTS_USER_LIST,
      { userId: userDetails.userId, ...queryParams },
    );
    return firstValueFrom(response$);
  }

  @Get('events/:eventId/reward-requests')
  @Roles(Role.OPERATOR, Role.AUDITOR, Role.ADMIN)
  async findAllByEvent(
    @Param('eventId') eventId: string,
    @Query() query: RewardRequestQueryDto,
  ): Promise<RewardRequestListResponseDto> {
    const response$ = this.eventClient.send<RewardRequestListResponseDto>(
      MessagePatterns.REWARD_REQUESTS_EVENT_LIST,
      { eventId, ...query },
    );
    return firstValueFrom(response$);
  }

  @Post('events/:eventId/reward-requests/:rewardRequestId/approve')
  @Roles(Role.OPERATOR, Role.AUDITOR, Role.ADMIN)
  async approveRewardRequest(
    @AuthenticatedUser() userDetails: AuthenticatedUserDetails,
    @Param('eventId') eventId: string,
    @Param('rewardRequestId') rewardRequestId: string,
  ): Promise<RewardRequestDto> {
    const response$ = this.eventClient.send<RewardRequestDto>(
      MessagePatterns.REWARD_REQUESTS_APPROVE,
      { eventId, rewardRequestId, approverId: userDetails.userId },
    );
    return firstValueFrom(response$);
  }
}
