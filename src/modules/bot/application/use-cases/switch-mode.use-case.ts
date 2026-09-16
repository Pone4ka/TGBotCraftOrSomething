import type { BotMode } from "../../../../core/user-mode/bot-mode";
import type { UserModePort } from "../../../../core/user-mode/user-mode.port";

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
