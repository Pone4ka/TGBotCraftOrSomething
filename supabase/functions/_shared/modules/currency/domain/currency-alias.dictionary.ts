/**
 * Maps free-form currency mentions (words, abbreviations, symbols) to ISO 4217 codes.
 * Keys are matched case-insensitively as whole tokens next to a number.
 */
export const CURRENCY_ALIASES: Record<string, string> = {
  // USD
  "$": "USD",
  usd: "USD",
  dollar: "USD",
  dollars: "USD",
  доллар: "USD",
  доллара: "USD",
  долларов: "USD",
  доллары: "USD",
  бакс: "USD",
  бакса: "USD",
  баксов: "USD",
  баксы: "USD",

  // EUR
  "€": "EUR",
  eur: "EUR",
  euro: "EUR",
  euros: "EUR",
  евро: "EUR",

  // RUB
  "₽": "RUB",
  rub: "RUB",
  руб: "RUB",
  рубль: "RUB",
  рубля: "RUB",
  рублей: "RUB",
  рубли: "RUB",

  // BYN
  byn: "BYN",
  br: "BYN",
  бел: "BYN",
  белрус: "BYN",

  // UAH
  "₴": "UAH",
  uah: "UAH",
  грн: "UAH",
  гривна: "UAH",
  гривны: "UAH",
  гривен: "UAH",
  гривень: "UAH",
  гривня: "UAH",

  // KZT
  "₸": "KZT",
  kzt: "KZT",
  тенге: "KZT",

  // GBP
  "£": "GBP",
  gbp: "GBP",
  pound: "GBP",
  pounds: "GBP",
  фунт: "GBP",
  фунта: "GBP",
  фунтов: "GBP",
  фунты: "GBP",

  // CNY
  cny: "CNY",
  rmb: "CNY",
  юань: "CNY",
  юаня: "CNY",
  юаней: "CNY",
  юани: "CNY",

  // PLN
  "zł": "PLN",
  pln: "PLN",
  zloty: "PLN",
  злотый: "PLN",
  злотых: "PLN",
  злотые: "PLN",

  // JPY
  "¥": "JPY",
  jpy: "JPY",
  yen: "JPY",
  иена: "JPY",
  иены: "JPY",
  иен: "JPY",
  йена: "JPY",
  йены: "JPY",
  йен: "JPY",

  // CHF
  chf: "CHF",
  franc: "CHF",
  francs: "CHF",
  франк: "CHF",
  франка: "CHF",
  франков: "CHF",

  // TRY
  "₺": "TRY",
  try: "TRY",
  lira: "TRY",
  лира: "TRY",
  лиры: "TRY",
  лир: "TRY",
};
