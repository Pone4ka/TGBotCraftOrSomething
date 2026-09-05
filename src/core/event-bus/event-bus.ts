import type { DomainEvent } from "./domain-event";

export type EventHandler<TEvent extends DomainEvent> = (event: TEvent) => void;

export interface EventBus {
  publish<TEvent extends DomainEvent>(event: TEvent): void;
  subscribe<TEvent extends DomainEvent>(
    eventName: TEvent["name"],
    handler: EventHandler<TEvent>,
  ): void;
}
