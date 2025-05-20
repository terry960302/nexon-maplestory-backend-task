import { IsNotEmpty, IsString } from "class-validator";

export class RewardRequestCreateDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
