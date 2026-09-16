// GENERATED FILE — do not edit directly, edit src/core/domain/domain-exception.ts instead.
// Regenerate with: pnpm sync:edge

export abstract class DomainException extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
