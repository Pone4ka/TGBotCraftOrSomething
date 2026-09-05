import type { DomainEvent } from "./domain-event.ts";
import type { EventBus, EventHandler } from "./event-bus.ts";

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<EventHandler<DomainEvent>>>();

  publish<TEvent extends DomainEvent>(event: TEvent): void {
    const handlers = this.handlers.get(event.name);
    if (!handlers) return;

    for (const handler of handlers) {
      handler(event);
    }
  }

  subscribe<TEvent extends DomainEvent>(
    eventName: TEvent["name"],
    handler: EventHandler<TEvent>,
  ): void {
    const handlers = this.handlers.get(eventName) ?? new Set();
    handlers.add(handler as EventHandler<DomainEvent>);
    this.handlers.set(eventName, handlers);
  }
}
