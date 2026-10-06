import { DomainException } from "../../../../core/domain/domain-exception";

export class MessageDeliveryFailedException extends DomainException {
  readonly code = "MESSAGE_DELIVERY_FAILED";

  constructor(reason: string) {
    super(`Telegram rejected the message: ${reason}`);
  }
}
