// GENERATED FILE — do not edit directly, edit src/modules/bot/domain/exceptions/empty-message-text.exception.ts instead.
// Regenerate with: pnpm sync:edge

import { DomainException } from "../../../../core/domain/domain-exception.ts";

export class EmptyMessageTextException extends DomainException {
  readonly code = "EMPTY_MESSAGE_TEXT";

  constructor() {
    super("Message text must not be empty");
  }
}
