import { EmptyMessageTextException } from "./exceptions/empty-message-text.exception.ts";

export interface ChatMessageProps {
  chatId: number;
  authorId: number;
  text: string;
  raw: unknown;
}

export class ChatMessage {
  readonly chatId: number;
  readonly authorId: number;
  readonly text: string;
  readonly raw: unknown;

  private constructor(props: ChatMessageProps) {
    this.chatId = props.chatId;
    this.authorId = props.authorId;
    this.text = props.text;
    this.raw = props.raw;
  }

  static create(props: ChatMessageProps): ChatMessage {
    if (props.text.trim().length === 0) {
      throw new EmptyMessageTextException();
    }

    return new ChatMessage(props);
  }
}
