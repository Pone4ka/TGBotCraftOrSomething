# Supabase Edge Functions

Помимо Node-приложения (`src/`), для каждого модуля (`bot`, `currency`, `student`) и для
чтения истории переписки (`chats`, `messages`) есть эквивалентная **Supabase Edge
Function** в `supabase/functions/`. Это тот же самый код с той же гексагональной
структурой (`domain` → `application` → `adapters`), но:

- выполняется на Deno в изолированной среде Supabase, а не в долгоживущем Node-процессе;
- получает Telegram-апдейты только через **webhook** (long polling для serverless не подходит —
  функция не может сама себя опрашивать в фоне);
- хранит состояние чата (режим бота, выбранный источник курса, целевая валюта) в Postgres
  вместо in-memory `Map` — иначе оно бы терялось между вызовами, ведь каждый вызов edge-функции
  может обслуживаться новым изолятом.

## Один источник бизнес-логики для двух рантаймов

`supabase/functions/_shared/` **не редактируется руками** — это сгенерированная копия
`src/` (см. `scripts/generate-edge-shared.mjs`). Domain/application/adapters-in слои
`bot`, `currency`, `student` — чистый TypeScript без Node-специфичных API, и раз порты
состояния (`UserModePort`, `ExchangeRateSourcePreferencePort`,
`TargetCurrencyPreferencePort`) асинхронные (см. `src/core/user-mode/user-mode.port.ts`),
их код буквально идентичен что под Node, что под Deno. Единственная реальная разница —
синтаксис модулей: Node/tsc резолвит relative-импорты без расширения и голые имена
пакетов, Deno требует `.ts` на relative-импортах и `npm:`-спецификатор с версией для
npm-пакетов. Генератор копирует файл и механически переписывает только это.

**Правило: правишь бизнес-логику — правишь только `src/`.** После изменений:

```bash
pnpm sync:edge                # перегенерировать supabase/functions/_shared из src/
supabase functions deploy bot # и любые другие затронутые функции
```

Раньше (до этого рефакторинга) `_shared` поддерживался руками отдельной копией — из-за
этого один и тот же баг (порядок регистрации обработчиков в `MenuBotController`) пришлось
чинить дважды в двух местах. Теперь чинить нужно только `src/`.

Каждый файл в `_shared` начинается с комментария `// GENERATED FILE — do not edit
directly` с указанием исходника — если видите такой комментарий, редактируйте файл,
который он называет, а не этот.

### Что НЕ генерируется (остаётся написанным руками отдельно для Deno)

- `_shared/core/config.ts`, `_shared/core/supabase/supabase-client.ts` — Deno-специфичное
  чтение `Deno.env` и создание Supabase-клиента.
- `_shared/core/user-mode/supabase-user-mode.adapter.ts` и
  `_shared/modules/currency/adapters/out/supabase-*-preference.adapter.ts` — Postgres-backed
  реализации портов (Node-аналоги — `InMemory*Adapter` в `src/`, они не годятся для
  serverless, см. ниже).
- `_shared/modules/bot/adapters/out/supabase-update-logger.adapter.ts` и
  `_shared/modules/bot/adapters/out/supabase-chat-history-query.adapter.ts` — Postgres-backed
  реализации `UpdateLoggerPort`/`ChatHistoryQueryPort` (записывают/читают `chats`/`messages`).
  У Node-приложения свои копии этих же классов в `src/modules/bot/adapters/out/` — сам
  класс не шарится (импорт `@supabase/supabase-js` различается), но реализуют они один и
  тот же порт и делают одни и те же запросы.
- `_shared/modules/currency/currency.module.ts` и `_shared/modules/student/student.module.ts`
  — фабрики, которые связывают адаптеры; для Deno они подключают Supabase-адаптеры вместо
  in-memory и (для currency) дополнительно отдают `convertAmount`/`parser` наружу для
  standalone HTTP-эндпоинта.
- Сами точки входа `functions/{bot,currency,student,chats,messages}/index.ts`.

## Структура

```
supabase/
├── config.toml
├── migrations/
│   ├── ..._bot_state_tables.sql   — таблицы для состояния чата (замена in-memory адаптеров)
│   └── ..._chat_history.sql       — таблицы chats/messages (переписка + ответы бота)
└── functions/
    ├── _shared/                    — СГЕНЕРИРОВАНО из src/, см. выше; структура папок
    │   │                              зеркалит src/ 1:1 (core/, modules/{bot,currency,student}/)
    │   ├── core/
    │   │   ├── config.ts                      (руками)
    │   │   ├── domain/domain-exception.ts      (генерируется)
    │   │   ├── supabase/supabase-client.ts    (руками)
    │   │   └── user-mode/
    │   │       ├── bot-mode.ts                 (генерируется)
    │   │       ├── user-mode.port.ts           (генерируется)
    │   │       └── supabase-user-mode.adapter.ts (руками)
    │   └── modules/
    │       ├── bot/       (domain/application/adapters-in — генерируется;
    │       │               adapters/out/supabase-update-logger.adapter.ts и
    │       │               adapters/out/supabase-chat-history-query.adapter.ts — руками)
    │       ├── currency/  (domain/application/adapters-in — генерируется;
    │       │               adapters/out/supabase-*.ts и currency.module.ts — руками)
    │       └── student/   (domain/application/adapters-in — генерируется;
    │                       student.module.ts — руками)
    ├── bot/index.ts                 — единственная точка входа Telegram-вебхука
    ├── currency/index.ts             — HTTP-эндпоинт конвертации (POST)
    ├── student/index.ts               — HTTP-эндпоинт информации о студенте (GET)
    ├── chats/index.ts                  — HTTP-эндпоинт списка чатов (GET), новые сверху
    └── messages/index.ts                — HTTP-эндпоинт списка сообщений (GET), новые сверху
```

`_shared` — соглашение Supabase CLI: код в этой папке не деплоится как отдельная функция,
но его можно импортировать из любой функции по относительному пути.

## Точки входа по модулям

| Модуль | Точка(и) входа | Файл |
|---|---|---|
| `bot` | Telegram webhook (POST) — меню, `/debug`, диспетчеризация в currency/student, запись переписки в `chats`/`messages` | `functions/bot/index.ts` |
| `currency` | HTTP POST `{ text, chatId }` напрямую; плюс обрабатывается внутри `bot`-вебхука | `functions/currency/index.ts` |
| `student` | **1)** HTTP GET → JSON `{ message, studentId }`. **2)** Telegram-бот — кнопка «🎓 Студент» обрабатывается в `functions/bot/index.ts` через тот же `GetStudentInfoUseCase` | `functions/student/index.ts` |
| `chats` | HTTP GET → JSON-массив всех чатов, `ORDER BY last_message_at DESC` | `functions/chats/index.ts` |
| `messages` | HTTP GET → JSON-массив всех сообщений (с `replyText`/`repliedAt`), `ORDER BY created_at DESC` | `functions/messages/index.ts` |

Telegram позволяет зарегистрировать только один webhook URL на бота, поэтому реальный
Telegram-трафик всегда приходит в `bot`. Модуль `student` тем не менее задуман с двумя
самостоятельными точками входа: прямой HTTP-запрос к `functions/student` и обращение через
бота — оба пути дергают один и тот же use-case, так же как в Node-приложении
`student.controller.ts` (HTTP) и `student-bot.controller.ts` (Telegram) оборачивают
`GetStudentInfoUseCase`. `chats`/`messages` — тоже "просто" HTTP: они только читают то, что
`bot` уже записал через `SupabaseUpdateLoggerAdapter`, см. [`bot.md`](./bot.md).

## Состояние в Postgres

| Таблица | Заменяет / для чего |
|---|---|
| `bot_user_modes` | `InMemoryUserModeAdapter` |
| `currency_source_preferences` | `InMemoryExchangeRateSourcePreferenceAdapter` |
| `currency_target_preferences` | `InMemoryTargetCurrencyPreferenceAdapter` |
| `chats` | Один ряд на Telegram-чат (`chat_id` = PK, всегда 1:1 переписка с пользователем): имя, фамилия, `last_message_at` (обновляется триггером `touch_chat_last_message`). |
| `messages` | Один ряд на входящее сообщение: текст вопроса + `reply_text`/`replied_at`, когда бот ответил. `chat_id` — FK на `chats`, `on delete cascade`. |

`chats`/`messages` защищены RLS без публичных policy — писать/читать может только
service-role ключ (`SUPABASE_SERVICE_ROLE_KEY`, автоматически доступен рантайму edge-функций;
Node-приложению нужно задать его явно в `.env`, см. [`core.md`](./core.md)).

Порты (`UserModePort`, `ExchangeRateSourcePreferencePort`, `TargetCurrencyPreferencePort`)
асинхронные и в `src/`, и в `_shared/` (буквально один и тот же сгенерированный файл) —
именно это позволяет `InMemory*Adapter` (Node, синхронная реализация, обёрнутая в `Promise`)
и `Supabase*Adapter` (Deno, реальный I/O через `@supabase/supabase-js`) реализовывать один
и тот же интерфейс, не заставляя use-case'ы и контроллеры знать, какая реализация под капотом.

## Локальный запуск и деплой

```bash
supabase login
supabase link --project-ref <project-ref>

# применить миграции (создаёт таблицы состояния + chats/messages)
supabase db push

# секреты для функций (BOT_TOKEN/EXCHANGE_API_KEY/WEBHOOK_SECRET придумываете сами;
# SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY подставляются платформой автоматически)
supabase secrets set BOT_TOKEN=... EXCHANGE_API_KEY=... WEBHOOK_SECRET=...

supabase functions deploy bot
supabase functions deploy currency
supabase functions deploy student
supabase functions deploy chats
supabase functions deploy messages

# зарегистрировать вебхук у Telegram (once)
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://<project-ref>.supabase.co/functions/v1/bot" \
  -d "secret_token=<WEBHOOK_SECRET>"
```

**Важно:** деплой не автоматический — ни git push, ни `pnpm sync:edge` не выкладывают код
на Supabase, они только готовят файлы локально. После **любого** изменения в `src/`
(что-то из `SHARED_FILES`) или напрямую в `supabase/functions/{bot,currency,student,chats,messages}/`
нужно вручную гонять `pnpm sync:edge` (если менялось что-то из `src/`) и
`supabase functions deploy <имя>` для каждой затронутой функции — иначе на проде
продолжит работать старый код. Отдельно про вебхук: `setWebhook` выше — one-off
регистрация URL у Telegram, а не что-то, что нужно повторять при каждом деплое. Но если
где-то ещё (например, локальный Node-процесс с `WEBHOOK_URL` в `.env`) вызовет
`bot.api.setWebhook(...)` с другим URL — он перезапишет вебхук и **боевой бот перестанет
отвечать** (Telegram шлёт апдейты только на последний зарегистрированный URL). Поэтому в
локальном `.env` `WEBHOOK_URL` намеренно не задаётся — локальный запуск всегда идёт через
polling.

Локально: `supabase start`, затем `supabase functions serve --env-file supabase/functions/.env`
(скопируйте `supabase/functions/.env.example` в `.env` рядом и заполните значения).
