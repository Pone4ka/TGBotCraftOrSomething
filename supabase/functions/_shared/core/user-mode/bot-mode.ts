// GENERATED FILE — do not edit directly, edit src/core/user-mode/bot-mode.ts instead.
// Regenerate with: pnpm sync:edge

export const BOT_MODES = ["home", "currency"] as const;

export type BotMode = (typeof BOT_MODES)[number];

/** No module selected yet — the bot module itself owns this state and prompts for a choice. */
export const DEFAULT_BOT_MODE: BotMode = "home";
