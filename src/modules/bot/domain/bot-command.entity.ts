import { InvalidCommandFormatException } from "./exceptions/invalid-command-format.exception.ts";

export class BotCommand {
  readonly chatId: number;
  readonly name: string;
  readonly args: string;

  private constructor(chatId: number, name: string, args: string) {
    this.chatId = chatId;
    this.name = name;
    this.args = args;
  }

  static create(chatId: number, rawText: string): BotCommand {
    if (!rawText.startsWith("/")) {
      throw new InvalidCommandFormatException(rawText);
    }

    const [rawName, ...rest] = rawText.slice(1).split(" ");
    if (!rawName) {
      throw new InvalidCommandFormatException(rawText);
    }

    return new BotCommand(chatId, rawName, rest.join(" "));
  }
}
