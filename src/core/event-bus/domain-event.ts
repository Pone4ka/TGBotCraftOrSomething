export interface DomainEvent<Name extends string = string> {
  readonly name: Name;
  readonly occurredAt: Date;
}
