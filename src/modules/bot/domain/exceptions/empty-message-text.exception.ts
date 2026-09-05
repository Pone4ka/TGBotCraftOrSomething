import { DomainException } from "../../../../core/domain/domain-exception";

export class EmptyMessageTextException extends DomainException {
  readonly code = "EMPTY_MESSAGE_TEXT";

  constructor() {
    super("Message text must not be empty");
  }
}
