import { IsUUID } from "class-validator";

export class EventParamDto {
  @IsUUID()
  eventId!: string;
}
