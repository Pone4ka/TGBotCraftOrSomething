import type { BotMode } from "../../../../core/bot-mode.ts";
import type { UserModePort } from "../../../../core/user-mode.port.ts";

export interface SwitchModeInput {
  chatId: number;
  mode: BotMode;
}

export class SwitchModeUseCase {
  constructor(private readonly userMode: UserModePort) {}

  async execute(input: SwitchModeInput): Promise<void> {
    await this.userMode.setMode(input.chatId, input.mode);
  }
}
