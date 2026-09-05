import { EmptyMessageTextException } from "./exceptions/empty-message-text.exception.ts";

export interface ChatMessageProps {
  chatId: number;
  authorId: number;
  text: string;
}

export class ChatMessage {
  readonly chatId: number;
  readonly authorId: number;
  readonly text: string;

  private constructor(props: ChatMessageProps) {
    this.chatId = props.chatId;
    this.authorId = props.authorId;
    this.text = props.text;
  }

  static create(props: ChatMessageProps): ChatMessage {
    if (props.text.trim().length === 0) {
      throw new EmptyMessageTextException();
    }

    return new ChatMessage(props);
  }
}
