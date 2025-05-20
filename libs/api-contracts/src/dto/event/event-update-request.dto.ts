import { EventStatus } from "@api-contracts/enums/event/event-status.enum";
import { IsNotEmpty } from "class-validator";

export class EventUpdateRequestDto {
  @IsNotEmpty()
  eventId!: string;
  status!: EventStatus;
}
