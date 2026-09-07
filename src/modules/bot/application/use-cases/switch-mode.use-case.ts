import { Inject, Injectable } from "@nestjs/common";
import type { BotMode } from "../../../../core/user-mode/bot-mode";
import { USER_MODE_PORT, type UserModePort } from "../../../../core/user-mode/user-mode.port";

export interface SwitchModeInput {
  chatId: number;
  mode: BotMode;
}

@Injectable()
export class SwitchModeUseCase {
  constructor(
    @Inject(USER_MODE_PORT) private readonly userMode: UserModePort,
  ) {}

  execute(input: SwitchModeInput): void {
    this.userMode.setMode(input.chatId, input.mode);
  }
}
