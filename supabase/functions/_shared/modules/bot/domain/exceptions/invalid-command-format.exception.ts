// GENERATED FILE — do not edit directly, edit src/modules/bot/domain/exceptions/invalid-command-format.exception.ts instead.
// Regenerate with: pnpm sync:edge

import { DomainException } from "../../../../core/domain/domain-exception.ts";

export class InvalidCommandFormatException extends DomainException {
  readonly code = "INVALID_COMMAND_FORMAT";

  constructor(rawText: string) {
    super(`"${rawText}" is not a valid bot command`);
  }
}
