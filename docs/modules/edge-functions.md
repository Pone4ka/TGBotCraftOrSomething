# Supabase Edge Functions

Помимо Node-приложения (`src/`), для каждого модуля (`bot`, `currency`, `student`) есть
эквивалентная **Supabase Edge Function** в `supabase/functions/`. Это тот же самый код с
той же гексагональной структурой (`domain` → `application` → `adapters`), но:

- выполняется на Deno в изолированной среде Supabase, а не в долгоживущем Node-процессе;
- получает Telegram-апдейты только через **webhook** (long polling для serverless не подходит —
  функция не может сама себя опрашивать в фоне);
- хранит состояние чата (режим бота, выбранный источник курса, целевая валюта) в Postgres
  вместо in-memory `Map` — иначе оно бы терялось между вызовами, ведь каждый вызов edge-функции
  может обслуживаться новым изолятом.

## Структура

```
supabase/
├── config.toml
├── migrations/
│   └── ..._bot_state_tables.sql   — таблицы для состояния чата (замена in-memory адаптеров)
└── functions/
    ├── _shared/                    — общий код модулей, импортируется всеми функциями
    │   ├── core/                     (domain-exception, bot-mode, user-mode.port + Supabase-адаптер)
    │   └── modules/
    │       ├── bot/                  (то же самое, что src/modules/bot, но без polling)
    │       ├── currency/             (то же самое, что src/modules/currency, порты асинхронные)
    │       └── student/               (то же самое, что src/modules/student)
    ├── bot/index.ts                 — единственная точка входа Telegram-вебхука
    ├── currency/index.ts             — HTTP-эндпоинт конвертации (POST)
    └── student/index.ts               — HTTP-эндпоинт информации о студенте (GET)
```

`_shared` — соглашение Supabase CLI: код в этой папке не деплоится как отдельная функция,
но его можно импортировать из любой функции по относительному пути.

## Точки входа по модулям

| Модуль | Точка(и) входа | Файл |
|---|---|---|
| `bot` | Telegram webhook (POST) — меню, `/debug`, диспетчеризация в currency/student | `functions/bot/index.ts` |
| `currency` | HTTP POST `{ text, chatId }` напрямую; плюс обрабатывается внутри `bot`-вебхука | `functions/currency/index.ts` |
| `student` | **1)** HTTP GET → JSON `{ message, studentId }`. **2)** Telegram-бот — кнопка «🎓 Студент» обрабатывается в `functions/bot/index.ts` через тот же `GetStudentInfoUseCase` | `functions/student/index.ts` |

Telegram позволяет зарегистрировать только один webhook URL на бота, поэтому реальный
Telegram-трафик всегда приходит в `bot`. Модуль `student` тем не менее задуман с двумя
самостоятельными точками входа: прямой HTTP-запрос к `functions/student` и обращение через
бота — оба пути дергают один и тот же use-case, так же как в Node-приложении
`student.controller.ts` (HTTP) и `student-bot.controller.ts` (Telegram) оборачивают
`GetStudentInfoUseCase`.

## Состояние в Postgres

| Таблица | Заменяет |
|---|---|
| `bot_user_modes` | `InMemoryUserModeAdapter` |
| `currency_source_preferences` | `InMemoryExchangeRateSourcePreferenceAdapter` |
| `currency_target_preferences` | `InMemoryTargetCurrencyPreferenceAdapter` |

Все асинхронные версии портов (`UserModePort`, `ExchangeRateSourcePreferencePort`,
`TargetCurrencyPreferencePort`) под `_shared/` возвращают `Promise` — в отличие от
синхронных портов в `src/`, — потому что чтение/запись идёт через `@supabase/supabase-js`.

## Локальный запуск и деплой

```bash
supabase login
supabase link --project-ref <project-ref>

# применить миграцию (создаёт таблицы состояния)
supabase db push

# секреты для функций (BOT_TOKEN/EXCHANGE_API_KEY/WEBHOOK_SECRET придумываете сами;
# SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY подставляются платформой автоматически)
supabase secrets set BOT_TOKEN=... EXCHANGE_API_KEY=... WEBHOOK_SECRET=...

supabase functions deploy bot
supabase functions deploy currency
supabase functions deploy student

# зарегистрировать вебхук у Telegram (once)
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://<project-ref>.supabase.co/functions/v1/bot" \
  -d "secret_token=<WEBHOOK_SECRET>"
```

Локально: `supabase start`, затем `supabase functions serve --env-file supabase/functions/.env`
(скопируйте `supabase/functions/.env.example` в `.env` рядом и заполните значения).
