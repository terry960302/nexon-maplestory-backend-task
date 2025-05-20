import { IsArray } from "class-validator";

export class FinalRuleConfigDto {
  @IsArray()
  prerequisiteRuleIds!: string[];
}
