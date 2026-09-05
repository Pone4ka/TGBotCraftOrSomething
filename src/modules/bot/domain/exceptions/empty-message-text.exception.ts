import { DomainException } from "../../../../shared/domain/domain-exception.ts";

export class EmptyMessageTextException extends DomainException {
  readonly code = "EMPTY_MESSAGE_TEXT";

  constructor() {
    super("Message text must not be empty");
  }
}
