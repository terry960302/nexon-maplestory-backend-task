import { EventStatus } from "@api-contracts/enums/event/event-status.enum";

export class EventDto {
  id!: string;
  name!: string;
  startedAt!: string;
  endedAt!: string;
  status!: EventStatus;
}
