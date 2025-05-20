import { Expose, Transform } from "class-transformer";
import { IsEmail, IsString, IsUUID, MinLength } from "class-validator";

export class SignUpResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  @IsUUID()
  id!: string;

  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @IsString()
  @MinLength(2)
  name!: string;
}
