import { IsOptional, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
import { PageableDto } from "@api-contracts/dto/common/pageable.dto";

export class EventGetQueryDto extends PageableDto {
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  active?: boolean;
}
