import { IsNotEmpty } from "class-validator";

export class RefreshTokenResponseDto {
  @IsNotEmpty()
  accessToken!: string;
}
