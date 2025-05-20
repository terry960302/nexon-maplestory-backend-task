import { IsOptional, IsString, IsInt, Min } from "class-validator";
import { PageableDto } from "@api-contracts/dto/common/pageable.dto";

export class RewardRequestGetQueryDto extends PageableDto {
  @IsOptional()
  @IsString()
  userId?: string; // 본인 이력만 조회할 때

  @IsOptional()
  @IsString()
  eventId?: string; // 이벤트별 필터

  @IsOptional()
  @IsString()
  status?: string; // 상태 필터 (SUCCESS, PENDING, FAILED 등)
}
