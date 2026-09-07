export const BOT_MODES = ["home", "currency", "craft"] as const;

export type BotMode = (typeof BOT_MODES)[number];

/** No module selected yet — the bot module itself owns this state and prompts for a choice. */
export const DEFAULT_BOT_MODE: BotMode = "home";
