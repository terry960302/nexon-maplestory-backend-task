import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class RewardItemDto {
  @IsNotEmpty()
  type!: string;

  @IsNumber()
  @IsPositive({ message: "값은 0보다 커야 합니다." })
  amount!: number;
}
