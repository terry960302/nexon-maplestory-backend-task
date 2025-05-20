import { Injectable, Logger } from '@nestjs/common';
import { RewardEngine } from '@event-microservice/domain/rewards/reward-engine';
import { createRulesFromDocs } from '@event-microservice/domain/rewards/rule-factory';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import {
  EventErrorCode,
  EventErrors,
} from '@event-microservice/shared/exceptions/event-error-code.enum';
import { RewardRequestStatus } from '@api-contracts/enums/event/reward-request-status.enum';
import { RewardRequestDto } from '@api-contracts/dto/reward-request/reward-request.dto';
import { RewardRequestCreateDto } from '@api-contracts/dto/reward-request/reward-request-create.dto';
import { TransactionHelper } from '@event-microservice/shared/helper/transaction.helper';
import { RewardRuleDocument } from '@event-microservice/infrastructure/schemas/reward-rule.schema';
import { RewardRequestMapper } from '@event-microservice/application/mappers/reward-request.mapper';
import { RewardRequestRepository } from '@event-microservice/infrastructure/repositories/reward-request.repository';
import { EventRepository } from '@event-microservice/infrastructure/repositories/event.repository';
import { UserActivityRepository } from '@event-microservice/infrastructure/repositories/user-activity.repository';
import { ClientSession, Types } from 'mongoose';
import {
  RewardRequest,
  RewardRequestDocument,
} from '@event-microservice/infrastructure/schemas/reward-request.schema';
import { EventDocument } from '@event-microservice/infrastructure/schemas/event.schema';
import { UserActivityDocument } from '@event-microservice/infrastructure/schemas/user-activity.schema';
import { RewardRequestGetQueryDto } from '@api-contracts/dto/reward-request/reward-request-get-query.dto';
import { PaginatedDto } from '@api-contracts/dto/common/paginated.dto';
import { RewardRequestApproveDto } from '@api-contracts/dto/reward-request/reward-request-approve.dto';
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';
import { EventValidator } from '../validators/event.validator';
@Injectable()
export class RewardRequestService {
  private readonly logger = new Logger(RewardRequestService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly rewardRequestRepository: RewardRequestRepository,
    private readonly userActivityRepository: UserActivityRepository,
    private readonly tx: TransactionHelper,
  ) {}

  // 보상 지급 요청 내역 조회(userId 필터 없으면 모든 사용자의 보상 지급 요청 내역 조회)
  async paginate(
    filter: RewardRequestGetQueryDto,
  ): Promise<PaginatedDto<RewardRequestDto>> {
    const requests: RewardRequestDocument[] =
      await this.rewardRequestRepository.findAll(filter);
    const total = await this.rewardRequestRepository.count(filter);
    return {
      data: RewardRequestMapper.toDtoList(requests),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }

  // [사용자, 운영자, 관리자] 보상 지급 요청 생성(자동이면 바로 처리, 수동이면 승인 대기)
  async createRewardRequest(
    eventId: string,
    createDto: RewardRequestCreateDto,
  ): Promise<RewardRequestDto> {
    return this.tx.transact(async (session) => {
      // 이벤트 조회
      const event = await this.findEventById(eventId, session);

      // 사용자 활동 조회
      const userActivity = await this.findUserActivityByUserId(
        createDto.userId,
        session,
      );

      // 과거 보상 지급 요청 조회
      const pastRuleIds = await this.getPastRuleIds(
        eventId,
        createDto.userId,
        session,
      );

      // 보상 엔진 실행
      const { newAchievedRuleIds, rewards } = this.runRewardEngine(
        event,
        userActivity,
        pastRuleIds,
      );

      // 보상 지급 요청 상태 결정
      const { status, conditionMet } = this.decideStatus(
        event.autoReward,
        newAchievedRuleIds,
        rewards,
      );

      // 보상 지급 요청 생성
      const rewardRequest = this.buildRewardRequest(
        eventId,
        createDto.userId,
        newAchievedRuleIds,
        rewards,
        status,
        conditionMet,
      );

      // 보상 지급 요청 저장
      const doc = await this.saveRewardRequest(rewardRequest, session);

      this.logger.log(
        `Reward request processed for user ${createDto.userId} in event ${eventId}. ` +
          `Status: ${status}, RuleIds: ${newAchievedRuleIds.join(',')}, Rewards: ${rewards.length}, Auto: ${event.autoReward}`,
      );

      return RewardRequestMapper.toDto(doc);
    });
  }

  // [운영자, 관리자] 보상 지급 요청 승인
  async approveRewardRequest(
    dto: RewardRequestApproveDto,
  ): Promise<RewardRequestDto> {
    return this.tx.transact(async (session) => {
      // 지급 요청 조회
      const rewardRequest = await this.rewardRequestRepository.findById(
        dto.rewardRequestId,
        session,
      );
      if (!rewardRequest) {
        throw new EventException(
          EventErrors[EventErrorCode.REWARD_REQUEST_NOT_FOUND],
        );
      }

      // 상태 검증 (반드시 PENDING이어야)
      if (rewardRequest.status !== RewardRequestStatus.PENDING) {
        throw new EventException(
          EventErrors[EventErrorCode.REWARD_REQUEST_STATUS_NOT_PENDING],
        );
      }

      // 승인 처리
      rewardRequest.status = RewardRequestStatus.SUCCESS;
      rewardRequest.approvedBy = new Types.ObjectId(dto.approverId);
      rewardRequest.approvedAt = new Date();

      await rewardRequest.save({ session });

      this.logger.log(
        `Reward request [${dto.rewardRequestId}] approved by operator [${dto.approverId}]`,
      );

      return RewardRequestMapper.toDto(rewardRequest);
    });
  }

  private async findEventById(eventId: string, session: any) {
    const event = await this.eventRepository.findById(eventId, session);
    if (!event) {
      throw new EventException(EventErrors[EventErrorCode.EVENT_NOT_FOUND]);
    }
    EventValidator.validateEventPeriod(event.startedAt, event.endedAt);
    EventValidator.checkActiveEvent(event.status);
    return event;
  }

  private async findUserActivityByUserId(userId: string, session: any) {
    const userActivity = await this.userActivityRepository.findByUserId(
      userId,
      session,
    );
    if (!userActivity) {
      throw new EventException(
        EventErrors[EventErrorCode.USER_ACTIVITY_NOT_FOUND],
      );
    }
    return userActivity;
  }

  private async getPastRuleIds(
    eventId: string,
    userId: string,
    session: any,
  ): Promise<string[]> {
    const previousRequests =
      await this.rewardRequestRepository.findPreviousSuccess(
        eventId,
        userId,
        session,
      );
    return previousRequests.flatMap(
      (req) => req.ruleIds?.map((id: Types.ObjectId) => id.toString()) ?? [],
    );
  }

  private runRewardEngine(
    event: EventDocument,
    userActivity: UserActivityDocument,
    pastRuleIds: string[],
  ) {
    // 이벤트와 연결된 규칙을 주입(이벤트에 존재하는 규칙들에 대해 사용자가 만족하는게 있는지 모두 확인하기 위함)
    const rules = createRulesFromDocs(
      event.rewardRules as RewardRuleDocument[],
    );

    // 규칙에 기반하여 보상 엔진 실행
    const rewardEngine = new RewardEngine(rules);
    // 메트릭 데이터와 과거 규칙 데이터(중복 여부 검증)를 기반으로 실행
    return rewardEngine.run(
      {
        loginStreak: userActivity.loginStreak,
        inviteCount: userActivity.inviteCount,
        purchaseTotal: userActivity.purchaseTotal,
      },
      pastRuleIds,
    );
  }

  private decideStatus(
    autoReward: boolean,
    newRuleIds: string[],
    rewards: RewardItem[],
  ): { status: RewardRequestStatus; conditionMet: boolean } {
    const conditionMet = newRuleIds.length > 0 && rewards.length > 0;

    // 조건이 만족되지 않은 경우
    if (!conditionMet) {
      return { status: RewardRequestStatus.FAILED, conditionMet };
    }

    // 자동 보상이 활성화된 경우
    if (autoReward) {
      return { status: RewardRequestStatus.SUCCESS, conditionMet };
    }

    // 수동 보상이 활성화된 경우
    return { status: RewardRequestStatus.PENDING, conditionMet };
  }

  // 보상 지급 요청 생성
  private buildRewardRequest(
    eventId: string,
    userId: string,
    newAchievedRuleIds: string[],
    rewards: any[],
    status: RewardRequestStatus,
    conditionMet: boolean,
  ): RewardRequest {
    return {
      _id: new Types.ObjectId(),
      eventId: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(userId),
      ruleIds: newAchievedRuleIds.map((id) => new Types.ObjectId(id)),
      rewards,
      status,
      requestedAt: new Date(),
      conditionMet,
    };
  }

  // 보상 지급 요청 저장
  private saveRewardRequest(
    rewardRequest: RewardRequest,
    session: ClientSession,
  ): Promise<RewardRequestDocument> {
    return this.rewardRequestRepository.create(rewardRequest, session);
  }
}
