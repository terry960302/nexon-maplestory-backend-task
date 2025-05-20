import { IsNotEmpty } from "class-validator";

export class RewardRequestApproveDto {
  @IsNotEmpty()
  rewardRequestId!: string;
  @IsNotEmpty()
  approverId!: string;
}
