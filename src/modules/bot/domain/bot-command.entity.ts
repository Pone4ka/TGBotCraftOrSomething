import { InvalidCommandFormatException } from "./exceptions/invalid-command-format.exception.ts";

export class BotCommand {
  readonly chatId: number;
  readonly name: string;
  readonly args: string;
  readonly raw: unknown;

  private constructor(chatId: number, name: string, args: string, raw: unknown) {
    this.chatId = chatId;
    this.name = name;
    this.args = args;
    this.raw = raw;
  }

  static create(chatId: number, rawText: string, raw: unknown): BotCommand {
    if (!rawText.startsWith("/")) {
      throw new InvalidCommandFormatException(rawText);
    }

    const [rawName, ...rest] = rawText.slice(1).split(" ");
    if (!rawName) {
      throw new InvalidCommandFormatException(rawText);
    }

    return new BotCommand(chatId, rawName, rest.join(" "), raw);
  }
}
