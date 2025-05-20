import { IsString, IsOptional, IsBoolean, IsDateString } from "class-validator";

export class EventCreateRequestDto {
  @IsString()
  name!: string;

  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;

  @IsBoolean()
  @IsOptional()
  autoReward?: boolean = true;
}
