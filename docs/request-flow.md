# Сквозной пример: путь одного сообщения

Чтобы архитектура из [`architecture.md`](./architecture.md) не осталась абстракцией, разберём по шагам, что происходит, когда пользователь, уже находясь в режиме "Валюты", пишет боту сообщение **"100 usd"**.

## 1. Сообщение доходит до сервера

- Если бот работает через **polling**: каждые `POLL_INTERVAL_MS` мс `startPolling` (`src/modules/bot/infrastructure/telegram-polling.ts`) спрашивает Telegram: "есть новые апдейты?" — и получает этот. Вызывает `bot.handleUpdate(update)`.
- Если через **webhook**: Telegram сам присылает POST-запрос на `/telegram/webhook/<секрет>`, который слушает Fastify (настроено в `bot-lifecycle.service.ts`). grammY внутри тоже сводится к вызову `bot.handleUpdate(update)`.

В обоих случаях дальше в дело вступает **grammY** — библиотека прогоняет апдейт через все зарегистрированные обработчики по очереди, в том порядке, в котором они были добавлены в `BotLifecycleService.onModuleInit()`.

## 2. Цепочка обработчиков (как middleware)

Порядок регистрации (`bot-lifecycle.service.ts`):

1. **`DebugBotController`** — проверяет, не команда ли это `/debug`. Нет — пропускает управление дальше (grammY сам передаёт следующему обработчику, если текущий не подписан на этот тип апдейта).
2. **`MenuBotController`** — есть блок `bot.on("message:text", ...)`, который срабатывает **на любое** текстовое сообщение. Проверяет: это команда? Нет. Режим чата — `"home"`? Нет, у нас уже `"currency"` (пользователь выбрал его раньше). Значит, условие `isBotCommand || mode !== "home"` истинно → вызывает `next()` и ничего не отвечает. Управление идёт дальше.
3. **`CurrencySourceBotController`** — слушает только `/source`, конкретную кнопку и callback-запросы. "100 usd" не подходит ни под один — пропускает молча (grammY идёт дальше сам).
4. **`CurrencyBotController`** — вот здесь начинается основная работа:
   - Сначала проверяется обработчик кнопки "Выбор валюты" — не совпадает, пропускается.
   - Затем — общий `bot.on("message:text", ...)`:
     - Не команда, режим — `"currency"" → условие пропуска ложно, продолжаем.
     - `targetCurrencyPreference.isAwaitingSelection(chatId)` — `false` (мы не в процессе выбора валюты).
     - Значит, идём в основную ветку: `await this.convertAmount.execute("100 usd", chatId)`.

## 3. Внутри `ConvertAmountUseCase`

Файл: `src/modules/currency/application/use-cases/convert-amount.use-case.ts`

1. `parser.parse("100 usd")` → `CurrencyTextParserService` находит по регулярке связку "число + известная валюта", смотрит `CURRENCY_ALIASES["usd"]` → `"USD"`, возвращает `{ amount: 100, currency: "USD", matchedText: "100 usd" }`.
2. `targetCurrencyPreference.getCurrency(chatId)` — предположим, пользователь ранее не выбирал целевую валюту → `undefined` → используется `DEFAULT_TARGET_CURRENCY = "USD"`.
3. Внимание: исходная валюта (`USD`) совпадает с целевой (`USD`)! Значит, конвертация не требуется — сразу возвращается `{ amount: 100, currency: "USD", converted: 100, targetCurrency: "USD" }`, **без похода в интернет**.

*(Если бы целевая валюта была, скажем, `EUR`, use-case пошёл бы дальше — в порт `ExchangeRatePort`.)*

## 3б. Если бы понадобилась реальная конвертация

`exchangeRate.convert(100, "USD", "EUR", chatId)` вызывает не абстрактный порт, а его текущую реализацию — `ExchangeRateRouterAdapter` (`exchange-rate-router.adapter.ts`), потому что именно он зарегистрирован под токеном `EXCHANGE_RATE_PORT` в `currency.module.ts`.

1. Роутер смотрит, какой источник выбрал этот чат (`sourcePreference.getSource(chatId)`) — по умолчанию `"frankfurter"`.
2. Пробует `FrankfurterExchangeRateAdapter.convert(...)` — делает `fetch` к `api.frankfurter.dev`.
3. Если Frankfurter не знает эту валюту (например, запросили RUB) — кидает `UnsupportedCurrencyBySourceException`, и роутер **автоматически** пробует запасной вариант — `ExchangeRateApiAdapter` (ходит на `v6.exchangerate-api.com` с ключом `EXCHANGE_API_KEY`).
4. Возвращается число — итоговая сумма в целевой валюте.

## 4. Ответ пользователю

Обратно в `CurrencyBotController`: получен ненулевой `result`, значит:

```
await ctx.reply(`${result.amount} ${result.currency} ≈ ${result.converted.toFixed(2)} ${result.targetCurrency}`);
```

Пользователь видит: **"100 USD ≈ 100.00 USD"** (в нашем примере, где валюты совпали).

После ответа контроллер всё равно вызывает `await next()` — управление идёт дальше по цепочке.

## 5. Последний в очереди — логирование

5. **`CraftBotController`** — режим не `"craft"`, пропускает.
6. **`TelegramBotController`** — срабатывают оба его обработчика (`message:entities:bot_command` — не подходит, это не команда; и просто `message` — подходит всегда). Вызывается `ReceiveMessageUseCase.execute(...)`:
   - Создаётся `ChatMessage.create({ chatId, authorId, text: "100 usd", raw })` — текст не пустой, значит, ошибки нет.
   - `ConsoleUpdateLoggerAdapter.logMessage(message)` печатает в консоль сервера текст сообщения и сырой JSON апдейта. Это просто лог для отладки, на ответ пользователю никак не влияет.

## Что если что-то пошло не так?

- **Ошибка парсинга** (например, число без валюты, "просто 100") — `ConvertAmountUseCase` вернёт `null`, контроллер вызовет `parser.detectIssue(...)` и ответит подсказкой типа "Введите значение и валюту".
- **Ошибка от внешнего API** (сеть недоступна, оба источника недоступны) — `ExchangeRateApiException` (это `DomainException`) перехватывается в `try/catch` внутри `CurrencyBotController`, пользователю пишут "Не удалось получить курс валют, попробуйте позже", а в консоль сервера — код ошибки для диагностики. Приложение не падает.
- **Настоящий баг** (ошибка не является `DomainException`) — исключение не перехватывается на уровне контроллера и всплывает выше; в `TelegramBotController.handle()` для необработанных команд это привело бы к падению — то есть это осознанно: непредвиденные ошибки не должны молча "проглатываться", чтобы их было видно в логах/мониторинге.

## Вывод

Каждый слой отвечает за своё:

- **Контроллер** (`adapters/in`) — понимает, "чей это ход" (проверяет режим/тип сообщения) и переводит "сырое" сообщение Telegram в вызов use-case'а на понятном бизнесу языке.
- **Use-case** (`application/use-cases`) — описывает сценарий, не заботясь о том, откуда пришли данные и куда уйдёт ответ.
- **Порт** (`application/ports`) — граница, через которую use-case просит "что-то сделать снаружи", не зная деталей.
- **Адаптер** (`adapters/out`) — знает все технические детали (URL, формат JSON конкретного API) и превращает их в простой результат, соответствующий порту.
- **Домен** (`domain`) — правила и структуры данных, которые верны независимо от Telegram, HTTP или чего угодно ещё.
