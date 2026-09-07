export const EXCHANGE_RATE_SOURCES = ["frankfurter", "exchangerate-api"] as const;

export type ExchangeRateSource = (typeof EXCHANGE_RATE_SOURCES)[number];

export const DEFAULT_EXCHANGE_RATE_SOURCE: ExchangeRateSource = "frankfurter";

export const EXCHANGE_RATE_SOURCE_LABELS: Record<ExchangeRateSource, string> = {
  frankfurter: "Frankfurter (ECB)",
  "exchangerate-api": "ExchangeRate-API",
};
