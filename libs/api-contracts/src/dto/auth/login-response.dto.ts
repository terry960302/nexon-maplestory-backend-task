import { IsNotEmpty } from "class-validator";

export class LoginResponseDto {
  @IsNotEmpty()
  accessToken!: string;
  @IsNotEmpty()
  refreshToken!: string;
}
