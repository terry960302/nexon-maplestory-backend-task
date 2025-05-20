import { IsString, IsInt, IsDefined, Min } from "class-validator";

export class PerConditionRuleConfigDto {
  @IsString()
  @IsDefined()
  metric!: string;

  @IsInt()
  @IsDefined()
  @Min(1)
  perThreshold!: number;
}
