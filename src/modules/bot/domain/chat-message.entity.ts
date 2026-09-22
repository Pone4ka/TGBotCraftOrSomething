import { EmptyMessageTextException } from "./exceptions/empty-message-text.exception";

export interface ChatMessageProps {
  chatId: number;
  authorId: number;
  text: string;
  raw: unknown;
  firstName?: string;
  lastName?: string;
}

export class ChatMessage {
  readonly chatId: number;
  readonly authorId: number;
  readonly text: string;
  readonly raw: unknown;
  readonly firstName?: string;
  readonly lastName?: string;

  private constructor(props: ChatMessageProps) {
    this.chatId = props.chatId;
    this.authorId = props.authorId;
    this.text = props.text;
    this.raw = props.raw;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
  }

  static create(props: ChatMessageProps): ChatMessage {
    if (props.text.trim().length === 0) {
      throw new EmptyMessageTextException();
    }

    return new ChatMessage(props);
  }
}
