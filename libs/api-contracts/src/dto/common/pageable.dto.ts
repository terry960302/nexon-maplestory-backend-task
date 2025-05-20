import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class PageableDto {
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  pageSize: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string; // createdAt, requestedAt 등

  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";
}
