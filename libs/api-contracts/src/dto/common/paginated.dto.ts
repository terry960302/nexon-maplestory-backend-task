import { IsNumber, Min } from "class-validator";

export class PaginatedDto<T> {
  data!: T[];

  @IsNumber()
  @Min(0)
  total!: number;

  @IsNumber()
  page!: number;

  @IsNumber()
  pageSize!: number;
}
