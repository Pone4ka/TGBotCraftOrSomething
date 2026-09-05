import { DomainException } from "../../../../shared/domain/domain-exception.ts";

export class InvalidCommandFormatException extends DomainException {
  readonly code = "INVALID_COMMAND_FORMAT";

  constructor(rawText: string) {
    super(`"${rawText}" is not a valid bot command`);
  }
}
