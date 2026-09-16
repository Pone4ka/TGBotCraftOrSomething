// GENERATED FILE — do not edit directly, edit src/modules/bot/application/use-cases/switch-mode.use-case.ts instead.
// Regenerate with: pnpm sync:edge

import type { BotMode } from "../../../../core/user-mode/bot-mode.ts";
import type { UserModePort } from "../../../../core/user-mode/user-mode.port.ts";

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
