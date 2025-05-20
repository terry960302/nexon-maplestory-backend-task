import { Injectable } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { EventDocument } from '@event-microservice/infrastructure/schemas/event.schema';
import { RewardRuleType } from '@api-contracts/enums/event/reward-rule-type.enum';
import { EventException } from '@event-microservice/shared/exceptions/event.exception';
import {
  EventErrorCode,
  EventErrors,
} from '@event-microservice/shared/exceptions/event-error-code.enum';
import { EventParamDto } from '@api-contracts/dto/event/event-param.dto';
import { RewardRuleDto } from '@api-contracts/dto/reward/reward-rule.dto';
import { RewardAddRequestDto } from '@api-contracts/dto/reward/reward-add-request.dto';
import { TransactionHelper } from '@event-microservice/shared/helper/transaction.helper';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EventRepository } from '@event-microservice/infrastructure/repositories/event.repository';
import { RewardMapper } from '../mappers/reward.mapper';
import { PerConditionRuleConfigDto } from '@api-contracts/dto/reward/rule-config/per-condition-rule-config.dto';
import { StageRuleConfigDto } from '@api-contracts/dto/reward/rule-config/stage-rule-config.dto';
import { FinalRuleConfigDto } from '@api-contracts/dto/reward/rule-config/final-rule-config.dto';

@Injectable()
export class RewardService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly tx: TransactionHelper,
  ) {}

  // 이벤트의 모든 규칙 및 보상 조회
  async findByEventId(param: EventParamDto): Promise<RewardRuleDto[]> {
    const event = await this.eventRepository.findById(param.eventId);
    if (!event) {
      throw new EventException(EventErrors[EventErrorCode.EVENT_NOT_FOUND]);
    }
    return event.rewardRules.map(RewardMapper.toRewardRuleDto);
  }

  // 이벤트에 보상 추가(기존 규칙 혹은 새로운 규칙 중 하나)
  async addReward(requestDto: RewardAddRequestDto): Promise<RewardRuleDto> {
    return this.tx.transact(async (session) => {
      const { eventId, ruleOptions } = requestDto;
      const event: EventDocument = await this.eventRepository.findById(
        eventId,
        session,
      );

      if (!event) {
        throw new EventException(EventErrors[EventErrorCode.EVENT_NOT_FOUND]);
      }

      // 기존 규칙에 보상 추가
      if (ruleOptions?.ruleId) {
        return this.addRewardToExistingRule(session, requestDto);
      }

      // 새로운 규칙 생성과 함께 보상 추가
      if (ruleOptions?.newRule) {
        return this.addRewardToNewRule(session, event, requestDto);
      }

      throw new EventException(
        EventErrors[EventErrorCode.REWARD_ADDITION_FAILED],
      );
    });
  }

  // 기존 규칙에 보상 추가
  private async addRewardToExistingRule(
    session: ClientSession,
    requestDto: RewardAddRequestDto,
  ) {
    const { eventId, rewardItem, ruleOptions } = requestDto;

    // 동시성 문제로 인해 $push를 이용해 배열 요소에 원자적(Atomic)으로 rewardItem 추가
    const updatedEvent = await this.eventRepository.findByIdAndUpdate(
      eventId,
      ruleOptions.ruleId,
      rewardItem,
      session,
    );

    if (!updatedEvent) {
      throw new EventException(
        EventErrors[EventErrorCode.REWARD_RULE_NOT_FOUND],
      );
    }

    // 추가된 후의 rewardRules 배열에서 해당 룰만 찾아 DTO로 매핑
    const updatedRule = updatedEvent.rewardRules.find(
      (r) => r._id.toString() === ruleOptions.ruleId,
    );
    if (!updatedRule) {
      throw new EventException(
        EventErrors[EventErrorCode.REWARD_RULE_NOT_FOUND],
      );
    }

    return {
      id: updatedRule._id.toString(),
      ruleType: updatedRule.ruleType as RewardRuleType,
      config: updatedRule.config,
      rewardItems: updatedRule.rewardItems.map(RewardMapper.toRewardItemDto),
    };
  }

  // 새로운 규칙 생성과 함께 보상 추가
  private async addRewardToNewRule(
    session: ClientSession,
    event: EventDocument,
    requestDto: RewardAddRequestDto,
  ): Promise<RewardRuleDto> {
    const { rewardItem, ruleOptions } = requestDto;

    this.validateRuleConfig(
      ruleOptions.newRule.ruleType,
      ruleOptions.newRule.config,
    );

    const newRule = {
      _id: new Types.ObjectId(),
      ruleType: ruleOptions.newRule.ruleType,
      config: ruleOptions.newRule.config,
      rewardItems: [rewardItem],
    };

    event.rewardRules.push(newRule);

    await this.eventRepository.upsert(event, session);

    return {
      id: newRule._id.toString(),
      ruleType: newRule.ruleType,
      config: newRule.config,
      rewardItems: newRule.rewardItems,
    };
  }

  // 규칙 타입별 config 유효성 검사
  private validateRuleConfig(ruleType: RewardRuleType, config: any): void {
    let dto: object;

    switch (ruleType) {
      case RewardRuleType.PER_CONDITION:
        dto = plainToInstance(PerConditionRuleConfigDto, config);
        break;
      case RewardRuleType.STAGE:
        dto = plainToInstance(StageRuleConfigDto, config);
        break;
      case RewardRuleType.FINAL:
        dto = plainToInstance(FinalRuleConfigDto, config);
        break;
      default:
        throw new EventException(
          EventErrors[EventErrorCode.UNSUPPORTED_RULE_TYPE],
        );
    }

    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new EventException(EventErrors[EventErrorCode.INVALID_RULE_CONFIG]);
    }
  }
}
