import { IsNotEmpty, IsNumber } from "class-validator";

export class UserActivityCreateRequestDto {
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  loginStreak?: number;

  @IsNumber()
  inviteCount?: number;

  @IsNumber()
  purchaseTotal?: number;
}
