import { IsString, IsInt, IsDefined, Min } from "class-validator";

export class StageRuleConfigDto {
  @IsString()
  @IsDefined()
  metric!: string;

  @IsInt()
  @IsDefined()
  @Min(1)
  stageThreshold!: number;
}
