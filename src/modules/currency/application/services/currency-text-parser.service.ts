import { Injectable } from "@nestjs/common";
import { CURRENCY_ALIASES } from "../../domain/currency-alias.dictionary";
import type { ParsedAmount } from "../../domain/parsed-amount";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type CurrencyParseIssue = "unrecognized-currency" | "missing-amount";

@Injectable()
export class CurrencyTextParserService {
  private readonly pattern: RegExp;
  private readonly genericPattern: RegExp;
  private readonly aliasStandalonePattern: RegExp;
  private readonly bareNumberPattern = /\d+(?:[.,]\d+)?/u;

  constructor() {
    const aliasKeys = Object.keys(CURRENCY_ALIASES).sort((a, b) => b.length - a.length);
    const aliasAlternation = aliasKeys.map(escapeRegExp).join("|");
    const amountGroup = "(\\d+(?:[.,]\\d+)?)";
    const genericWordGroup = "([\\p{L}\\p{Sc}]+)";
    const boundary = "(?![\\p{L}\\p{N}])";
    const lookbehind = "(?<![\\p{L}\\p{N}])";

    this.pattern = new RegExp(
      `${amountGroup}\\s*(${aliasAlternation})${boundary}` +
        `|${lookbehind}(${aliasAlternation})\\s*${amountGroup}`,
      "giu",
    );

    // Same "amount + word" / "word + amount" shape as `pattern`, but the word can be
    // anything — used to tell "currency not recognized" apart from "no amount at all".
    this.genericPattern = new RegExp(
      `${amountGroup}\\s*${genericWordGroup}${boundary}` +
        `|${lookbehind}${genericWordGroup}\\s*${amountGroup}`,
      "giu",
    );

    this.aliasStandalonePattern = new RegExp(
      `${lookbehind}(?:${aliasAlternation})${boundary}`,
      "giu",
    );
  }

  /** Returns the first recognized "amount + currency" mention in free-form text, or null. */
  parse(text: string): ParsedAmount | null {
    this.pattern.lastIndex = 0;
    const match = this.pattern.exec(text);
    if (!match) return null;

    const [matchedText, amountBefore, aliasAfter, aliasBefore, amountAfter] = match;
    const rawAmount = amountBefore ?? amountAfter;
    const alias = (aliasAfter ?? aliasBefore).toLowerCase();
    const currency = CURRENCY_ALIASES[alias];
    if (!currency || !rawAmount) return null;

    return {
      amount: Number(rawAmount.replace(",", ".")),
      currency,
      matchedText,
    };
  }

  /** Resolves a free-form currency name/code/symbol mentioned anywhere in the text
   * (no amount required) to its ISO 4217 code, using the same alias dictionary as parse(). */
  parseCurrencyName(text: string): string | null {
    this.aliasStandalonePattern.lastIndex = 0;
    const match = this.aliasStandalonePattern.exec(text);
    if (!match) return null;

    return CURRENCY_ALIASES[match[0].toLowerCase()] ?? null;
  }

  /**
   * Call when parse() returns null to tell why: an amount was paired with a word that
   * isn't a known currency, or either half (currency or amount) showed up alone.
   */
  detectIssue(text: string): CurrencyParseIssue | null {
    this.genericPattern.lastIndex = 0;
    const match = this.genericPattern.exec(text);
    if (match) {
      const [, , wordAfterAmount, wordBeforeAmount] = match;
      const word = (wordAfterAmount ?? wordBeforeAmount)?.toLowerCase();
      if (word && !CURRENCY_ALIASES[word]) {
        return "unrecognized-currency";
      }
    }

    this.aliasStandalonePattern.lastIndex = 0;
    if (this.aliasStandalonePattern.test(text)) {
      return "missing-amount";
    }

    // No word was attached to it at all (caught above otherwise) — an amount with no
    // currency mentioned still needs the user to say which currency it's in.
    if (this.bareNumberPattern.test(text)) {
      return "unrecognized-currency";
    }

    return null;
  }
}
