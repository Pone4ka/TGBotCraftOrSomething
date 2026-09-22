# `src/modules/bot` — ядро бота

Этот модуль отвечает за: подключение к Telegram, запуск (polling/webhook), главное меню и переключение между режимами, а также персистентность переписки (`chats`/`messages` в Postgres) — и логирование входящих сообщений/команд, и запись ответов бота, и чтение истории через HTTP. Именно он "дирижирует" остальными модулями (`currency`, `student`).

## `bot.module.ts`

**`createBotModule(deps)`** — фабрика, которая собирает всё воедино вручную (никакого DI-контейнера).

Принимает `{ config, userMode, currency, student, httpServer, supabaseClient }` (уже собранные модули `currency`/`student`, общий `UserModePort`, конфиг, Fastify-инстанс и клиент Supabase — см. [`core.md`](./core.md)). Внутри:
- создаёт объект бота grammY (`createBot(config)`);
- создаёт `SupabaseUpdateLoggerAdapter(supabaseClient)` — логгер апдейтов, теперь пишущий в Postgres, а не в консоль;
- регистрирует на `bot.api.config.use(...)` API-трансформер, который перехватывает каждый исходящий `sendMessage` и передаёт его текст в `updateLogger.logReply(...)` — независимо от того, какой контроллер отвечает (см. раздел про захват ответов ниже);
- создаёт use-case'ы (`ReceiveMessage`, `ReceiveCommand`, `SwitchMode`) и собственные контроллеры (`Menu`, `Debug`, `Telegram`);
- создаёт `SupabaseChatHistoryQueryAdapter(supabaseClient)` и регистрирует HTTP-роуты `GET /chats`/`GET /messages` (`registerChatHistoryRoutes`) прямо на переданный `httpServer`;
- собирает `BotLifecycleService`, передавая ему контроллеры этого модуля и контроллеры `currency`/`student`, полученные через `deps`.

Возвращает наружу только `{ start(), stop() }` — остальным частям приложения (`main.ts`) не нужно знать про внутренние детали.

## `infrastructure/` — низкоуровневая механика

### `bot.provider.ts`

**Функция `createBot(config): Bot`** — создаёт экземпляр `Bot` из библиотеки grammY, передавая ему `BOT_TOKEN` из конфига.

### `telegram-polling.ts`

**Функция `startPolling(bot, intervalMs)`** — реализует long polling вручную (без встроенного `bot.start()` из grammY, чтобы иметь полный контроль над интервалом и завершением).

Как работает:
1. Сначала на всякий случай удаляет вебхук (`deleteWebhook`) — если до этого бот работал через вебхук, нужно его снять, иначе Telegram не будет отдавать апдейты через `getUpdates`.
2. Каждые `intervalMs` миллисекунд (по умолчанию 3000) вызывает `bot.api.getUpdates({ offset, timeout: 0 })` — спрашивает у Telegram "что нового с апдейта номер `offset`".
3. Для каждого полученного апдейта: сдвигает `offset` на `update_id + 1` (чтобы в следующий раз не получить это же сообщение снова) и вызывает `bot.handleUpdate(update)` — это запускает всю цепочку обработчиков grammY (описанных в контроллерах).
4. Флаг `isPolling` — защита от "наложения" запросов: если предыдущий опрос ещё не завершился, новый не запускается.
5. Ошибки сети/API логируются в консоль, но не останавливают polling.
6. Возвращает `NodeJS.Timeout` (идентификатор таймера `setInterval`), чтобы его можно было остановить при выключении приложения.

### `bot-lifecycle.service.ts`

**`BotLifecycleService`** — класс, который управляет жизненным циклом бота: явно запускается вызовом `start()` из `bot.module.ts`/`main.ts` и явно останавливается вызовом `stop()` (никаких хуков жизненного цикла фреймворка — просто обычные асинхронные методы).

`start()` делает по порядку:
1. Регистрирует обработчики всех контроллеров в определённом порядке (порядок важен для grammY — это как middleware в Express):
   - `DebugBotController` — первым, чтобы скрытая команда `/debug` работала всегда, независимо от режима чата;
   - `TelegramBotController` — **вторым**, до всего, что может ответить пользователю. Это специально: он пишет входящее сообщение в `messages` (Postgres) *до* того, как какой-либо контроллер вызовет `ctx.reply(...)`. API-трансформер, который ловит исходящий ответ (`bot.module.ts`), ищет "последнее сообщение этого чата без ответа" — если бы логирование стояло в конце цепочки (как было раньше), к моменту ответа строка сообщения ещё не существовала бы, и ответ было бы не к чему привязать;
   - `MenuBotController` — чтобы команды переключения режима (`/start`, `/currency`, кнопки меню) перехватывались раньше, чем логика конкретных модулей;
   - `CurrencySourceBotController`, `CurrencyBotController` — модуль-фича `currency`;
   - `StudentBotController` — модуль-фича `student`;
   - `MenuBotController.registerFallback` — последним, ловит любой текст, не распознанный выше.
2. Вызывает `bot.init()` — grammY подгружает информацию о самом боте (username и т.д.) от Telegram.
3. Регистрирует список команд бота через `setMyCommands` — это то, что видит пользователь при нажатии на "/" в Telegram (кнопка со списком команд). Обратите внимание: `/debug` туда намеренно **не входит** — она скрытая.
4. Если в конфиге задан `webhookUrl` — настраивает вебхук (`setUpWebhook`), иначе — запускает polling (`setUpPolling`).

`setUpWebhook(httpServer, webhookUrl, secretToken)`:
- `secretToken` (обязательный `WEBHOOK_SECRET`) уже гарантированно задан к этому моменту — это проверяется на уровне `loadConfig()`, при старте приложения, а не здесь.
- Формирует путь вида `/telegram/webhook/<секрет>` — секрет в самом URL защищает от того, что кто-то посторонний в интернете начнёт слать поддельные апдейты на ваш эндпоинт.
- Монтирует обработчик прямо на переданный Fastify-инстанс (`httpServer.post(path, webhookCallback(...))`) — тот же самый инстанс, что создан в `main.ts` и на котором уже висят health-роуты и роут `student`.
- Сообщает Telegram новый URL через `bot.api.setWebhook(...)`.

`setUpPolling(bot, intervalMs)` — просто вызывает `startPolling` из `telegram-polling.ts` и сохраняет идентификатор таймера в `this.pollingHandle`.

`stop()` — если запущен polling, останавливает таймер (`clearInterval`). Для вебхука отдельная остановка не нужна — это просто HTTP-роут.

## `adapters/in/` — кто первым видит сообщение пользователя

Все три контроллера регистрируют свои обработчики через метод `registerHandlers(bot)`, который вызывает `bot.command(...)`, `bot.hears(...)` или `bot.on(...)` из grammY. Это похоже на `app.use()` в Express: обработчики выстраиваются в цепочку, и вызов `next()` внутри обработчика передаёт управление следующему в очереди. Если `next()` не вызвать — обработка на этом контроллере и заканчивается (более поздние контроллеры это сообщение не увидят).

### `debug-bot.controller.ts`

**`DebugBotController`** — скрытая команда `/debug`. Не показывается в меню команд Telegram (не передана в `setMyCommands`), но сработает, если пользователь напечатает её вручную, в любом режиме. Отвечает JSON-снимком состояния текущего чата: `chatId`, `userId`, текущий режим (`mode`), выбранный источник курса валют, выбранная целевая валюта, и флаг "ждём ли ввод валюты". Полезно для отладки без залезания в логи сервера. **Не вызывает `next()`** — команда полностью обрабатывается здесь.

### `menu-bot.controller.ts`

**`MenuBotController`** — главное меню и переключение режимов.

Ключевые константы:
- `HOME_KEYBOARD` — reply-клавиатура (обычные кнопки внизу экрана Telegram) с кнопкой "💱 Валюты" и кнопкой студента.
- `MODE_KEYBOARDS` — для режима `currency` своя клавиатура: "◀️ Назад" + кнопки этого режима ("Сменить API" и "Выбор валюты").
- `MODE_REPLIES` — текст, который бот отправляет при входе в конкретный режим.

Обработчики:
- `/start` → `goHome` — сбрасывает режим на `"home"` и показывает главное меню.
- `/currency` → `switchAndReply` — переключает режим (через `SwitchModeUseCase`) и показывает клавиатуру этого режима.
- Нажатие на кнопку "💱 Валюты" — то же самое, что команда выше, но через `bot.hears(текст_кнопки, ...)`.
- Нажатие "◀️ Назад" → `goHome`.
- Общий обработчик любого текстового сообщения (`bot.on("message:text", ...)`) — если сообщение не команда и текущий режим чата — `"home"` (то есть режим ещё не выбран), бот просто повторно показывает главное меню-приглашение. Если это команда или режим уже не `"home"` — просто пропускает дальше (`next()`), пусть с сообщением разбирается модуль соответствующего режима.

**Private-методы `goHome` и `switchAndReply` не вызывают `next()`** — переключение режима полностью обрабатывается здесь, дальше по цепочке (в `currency`-контроллер) сообщение не идёт.

### `telegram-bot.controller.ts`

**`TelegramBotController`** — самый общий обработчик входящих апдейтов (не путать с "последним в цепочке" — см. про порядок регистрации выше). Ничего не решает бизнес-логически, просто логирует и **всегда** вызывает `next()`, чтобы дальше по цепочке отработали `Menu`/`Currency`/`Student`:

- `message:entities:bot_command` (когда в сообщении Telegram распознал команду) → `ReceiveCommandUseCase.execute(...)`.
- `message` (вообще любое сообщение) → `ReceiveMessageUseCase.execute(...)`, передавая также `firstName`/`lastName` из `ctx.from` (нужны для `chats.first_name`/`last_name`).

Метод `handle(run)` — обёртка: ловит исключения. Если поймано `DomainException` — просто логирует код ошибки в консоль и не роняет процесс (это ожидаемая, "мягкая" ошибка вроде "текст сообщения пустой"). Если исключение другого типа — перебрасывает дальше (значит, это баг, который не должен молча проглатываться).

## `adapters/out/` — куда уходит лог и откуда читается история

### `supabase-update-logger.adapter.ts`

**`SupabaseUpdateLoggerAdapter`** — основная реализация `UpdateLoggerPort`, пишет в Postgres (таблицы `chats`/`messages`, см. `supabase/migrations/..._chat_history.sql`):

- `logMessage(message)` — `upsert` в `chats` (`chat_id`, `first_name`, `last_name`) и `insert` в `messages` (`chat_id`, `text`). Триггер `touch_chat_last_message` в БД сам обновляет `chats.last_message_at`.
- `logCommand(command)` — команды (`/start`, `/currency`, ...) в `messages` не пишутся, это управляющий поток, а не контент переписки; просто печатает в консоль.
- `logReply(chatId, text)` — находит самое свежее сообщение этого чата, у которого ещё нет ответа (`reply_text is null`), и проставляет ему `reply_text`/`replied_at`. Если такого сообщения нет (например, ответ — реакция на нажатие кнопки, а не на текстовое сообщение) — молча ничего не делает.

Вызывается не только из use-case'ов `Receive*`, но и напрямую из API-трансформера в `bot.module.ts` (см. ниже) — именно так ответы бота попадают в базу независимо от того, какой контроллер их отправил.

Не входит в `SHARED_FILES` (`scripts/generate-edge-shared.mjs`), потому что напрямую использует `@supabase/supabase-js`, чей импорт различается между Node и Deno — у edge-функции свой файл-двойник, см. [`edge-functions.md`](./edge-functions.md).

### `console-update-logger.adapter.ts`

**`ConsoleUpdateLoggerAdapter`** — альтернативная реализация `UpdateLoggerPort`, просто печатает в консоль (`console.log`) вместо записи в БД. Сейчас нигде не подключена (раньше была основной), оставлена как более простой пример реализации порта и как быстрый способ временно отключить персистентность при отладке.

### `supabase-chat-history-query.adapter.ts`

**`SupabaseChatHistoryQueryAdapter`** — реализация `ChatHistoryQueryPort` (см. ниже), читает `chats`/`messages` из Postgres для HTTP-роутов истории переписки. Как и логгер, не входит в `SHARED_FILES` (Postgres-клиент различается между рантаймами).

## `adapters/in/chat-history.controller.ts`

**`registerChatHistoryRoutes(app, listChats, listMessages)`** — монтирует на Fastify-инстанс:

- `GET /chats` → `ListChatsUseCase.execute()` — все чаты, новые сверху (`ORDER BY last_message_at DESC`).
- `GET /messages` → `ListMessagesUseCase.execute()` — все сообщения, новые сверху (`ORDER BY created_at DESC`), с полями `replyText`/`repliedAt`, если бот уже ответил.

Не входит в `SHARED_FILES` — Fastify-специфичная обвязка; у edge-функций свои точки входа (`functions/chats/index.ts`, `functions/messages/index.ts`), см. [`edge-functions.md`](./edge-functions.md).

## `application/ports/`

### `update-logger.port.ts`

**`UpdateLoggerPort`** — интерфейс: `logMessage(message)`, `logCommand(command)`, `logReply(chatId, text)`. Все три метода асинхронные (`Promise<void>`) — по той же причине, что и `UserModePort` (см. [`core.md`](./core.md)): один и тот же код порта работает что под Node (`SupabaseUpdateLoggerAdapter` реально пишет в БД), что под Deno.

### `chat-history-query.port.ts`

**`ChatHistoryQueryPort`** — интерфейс: `listChats(): Promise<ChatSummary[]>`, `listMessages(): Promise<StoredMessage[]>`. Только Postgres-реализация — in-memory аналога нет, история переписки не существует, пока не сохранена.

## `application/use-cases/` — сценарии использования

### `receive-message.use-case.ts`

**`ReceiveMessageUseCase.execute(input)`** — принимает `{ chatId, authorId, text, raw, firstName?, lastName? }`, создаёт доменную сущность `ChatMessage.create(input)` (это может бросить `EmptyMessageTextException`, если текст пустой) и `await` передаёт её логгеру.

### `receive-command.use-case.ts`

**`ReceiveCommandUseCase.execute(input)`** — принимает `{ chatId, text, raw }`, создаёт сущность `BotCommand.create(...)` (может бросить `InvalidCommandFormatException`, если текст не начинается с `/`) и `await` логирует её.

### `switch-mode.use-case.ts`

**`SwitchModeUseCase.execute(input)`** — принимает `{ chatId, mode }` и просто вызывает `userMode.setMode(chatId, mode)`. Самый простой use-case в проекте — хорошая иллюстрация того, что use-case не обязан быть сложным, важна сама точка входа.

### `list-chats.use-case.ts` / `list-messages.use-case.ts`

**`ListChatsUseCase.execute()`** / **`ListMessagesUseCase.execute()`** — тонкие обёртки над `ChatHistoryQueryPort.listChats()`/`listMessages()`, по образцу `GetStudentInfoUseCase` (см. [`student`-модуль]): вся логика — в адаптере, use-case существует, чтобы у контроллера была единая точка входа, а не прямая зависимость от Postgres-адаптера.

## Захват ответов бота (`bot.module.ts`)

Ответы бота (`ctx.reply(...)`) отправляются из разных контроллеров (`Menu`, `Currency`, `Student`) — каждый из них ничего не знает про персистентность. Вместо того чтобы протаскивать логгер в каждый контроллер, `bot.module.ts` подписывается на **grammY API-трансформер**:

```typescript
bot.api.config.use(async (prev, method, payload, signal) => {
  const result = await prev(method, payload, signal);
  if (method === "sendMessage" && "chat_id" in payload && "text" in payload) {
    await updateLogger.logReply(Number(payload.chat_id), String(payload.text));
  }
  return result;
});
```

Это перехватывает **любой** вызов `bot.api.sendMessage` (а значит и `ctx.reply`) независимо от того, откуда он вызван, и передаёт текст в `logReply` — см. выше. Важно: перехват сработает даже если сам вызов к Telegram API завершится ошибкой (`prev(...)` в grammY возвращает "сырой" ответ раньше, чем на его основе бросается `GrammyError`), поэтому ответ логируется независимо от успешности доставки.

## `domain/` — сущности и их правила

### `chat-message.entity.ts`

**Класс `ChatMessage`** — представляет валидное сообщение в чате. У класса **приватный конструктор** и статический фабричный метод `create(props)` — это распространённый паттерн: нельзя создать объект `ChatMessage`, минуя проверку правил. `create` проверяет, что `text.trim().length !== 0`, иначе бросает `EmptyMessageTextException`. Помимо `chatId`/`authorId`/`text`/`raw`, несёт опциональные `firstName`/`lastName` (имя отправителя из Telegram) — используются `SupabaseUpdateLoggerAdapter` для `chats.first_name`/`last_name`.

### `bot-command.entity.ts`

**Класс `BotCommand`** — представляет валидную команду (`/имя аргументы`). Тоже приватный конструктор + `create(chatId, rawText, raw)`:
- Проверяет, что текст начинается с `/`.
- Отрезает `/`, разбивает по пробелу: первое слово — имя команды (`name`), остальное — аргументы одной строкой (`args`).
- Если после `/` пусто — тоже ошибка.
- Бросает `InvalidCommandFormatException` при нарушении.

### `exceptions/`

- **`empty-message-text.exception.ts`** — `EmptyMessageTextException`, код `EMPTY_MESSAGE_TEXT`.
- **`invalid-command-format.exception.ts`** — `InvalidCommandFormatException`, код `INVALID_COMMAND_FORMAT`.

Обе наследуются от `DomainException` (см. [`core.md`](./core.md)).
