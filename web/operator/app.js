// Operator panel: chat list on the left, the selected conversation on the right, a
// composer that sends messages on the bot's behalf. Talks to the Node app's routes from
// src/modules/bot/adapters/in/chat-history.controller.ts:
//   GET  /chats                     — ChatSummary[], newest first
//   GET  /messages?chatId=…         — StoredMessage[] of one chat, newest first
//   POST /chats/:chatId/messages    — { text } → StoredMessage
//   GET  /events                    — SSE stream: `chat` (ChatSummary) / `message` (StoredMessage)
(() => {
  "use strict";

  const AVATAR_COLORS = ["#e17076", "#faa774", "#a695e7", "#7bc862", "#6ec9cb", "#65aadd", "#ee7aae"];

  const state = {
    chats: new Map(), // chatId → ChatSummary
    chatsLoaded: false,
    messages: new Map(), // chatId → Map(id → StoredMessage), only for chats opened so far
    activeChatId: null,
    drafts: new Map(), // chatId → unsent composer text
    search: "",
    sending: false,
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    app: $("app"),
    search: $("search"),
    connection: $("connection"),
    chatList: $("chat-list"),
    chatListEmpty: $("chat-list-empty"),
    placeholder: $("placeholder"),
    chat: $("chat"),
    back: $("back"),
    chatAvatar: $("chat-avatar"),
    chatName: $("chat-name"),
    chatMeta: $("chat-meta"),
    messages: $("messages"),
    composer: $("composer"),
    input: $("composer-input"),
    send: $("send"),
    error: $("composer-error"),
  };

  // ---------- API ----------

  async function api(path, options) {
    const response = await fetch(path, options);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error((body && (body.message || body.error)) || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function loadChats() {
    const chats = await api("/chats");
    state.chats = new Map(chats.map((chat) => [chat.chatId, chat]));
    state.chatsLoaded = true;
    renderChatList();
    if (state.activeChatId !== null) renderChatHeader();
  }

  async function loadMessages(chatId) {
    const messages = await api(`/messages?chatId=${encodeURIComponent(chatId)}`);
    state.messages.set(chatId, new Map(messages.map((message) => [message.id, message])));
    if (chatId === state.activeChatId) renderMessages({ forceScroll: true });
  }

  // ---------- Live updates (SSE) ----------

  function connect() {
    const source = new EventSource("/events");

    source.addEventListener("open", () => {
      setConnection("online", "Обновления в реальном времени");
      // Anything that happened while disconnected never reaches us as an event —
      // re-read the current state on every (re)connect.
      resync();
    });

    source.addEventListener("error", () => {
      // EventSource reconnects by itself (the server sends `retry: 3000`).
      setConnection("offline", "Нет соединения, переподключение…");
    });

    source.addEventListener("chat", (event) => upsertChat(JSON.parse(event.data)));
    source.addEventListener("message", (event) => upsertMessage(JSON.parse(event.data)));
  }

  function resync() {
    loadChats().catch(reportLoadError);
    if (state.activeChatId !== null) loadMessages(state.activeChatId).catch(reportLoadError);
  }

  function setConnection(status, title) {
    el.connection.className = `connection ${status}`;
    el.connection.title = title;
  }

  function reportLoadError(error) {
    console.error("[operator]", error);
  }

  function upsertChat(chat) {
    state.chats.set(chat.chatId, chat);
    renderChatList();
    if (chat.chatId === state.activeChatId) renderChatHeader();
  }

  function upsertMessage(message) {
    const messages = state.messages.get(message.chatId);
    // Chats that haven't been opened yet get their history in full when they are.
    if (!messages) return;
    messages.set(message.id, message);
    if (message.chatId === state.activeChatId) renderMessages();
  }

  // ---------- Chat list ----------

  function sortedChats() {
    const time = (chat) => Date.parse(chat.lastMessageAt ?? chat.createdAt) || 0;
    return [...state.chats.values()].sort((a, b) => time(b) - time(a));
  }

  function renderChatList() {
    const query = state.search.trim().toLowerCase();
    const chats = sortedChats().filter(
      (chat) => !query || displayName(chat).toLowerCase().includes(query) || String(chat.chatId).includes(query),
    );

    el.chatList.replaceChildren(...chats.map(renderChatItem));
    el.chatListEmpty.hidden = !state.chatsLoaded || state.chats.size !== 0;
  }

  function renderChatItem(chat) {
    const item = h("li", { className: "chat-item" + (chat.chatId === state.activeChatId ? " active" : "") }, [
      renderAvatar(chat),
      h("div", { className: "chat-item-body" }, [
        h("div", { className: "chat-item-top" }, [
          h("span", { className: "chat-item-name", textContent: displayName(chat) }),
          h("span", { className: "chat-item-time", textContent: formatListTime(chat.lastMessageAt) }),
        ]),
        h("div", { className: "chat-item-bottom" }, [
          h("span", { className: "chat-item-preview" }, [
            chat.lastMessageFromBot ? h("span", { className: "chat-item-sender", textContent: "Бот: " }) : null,
            document.createTextNode(chat.lastMessageText ?? "Нет сообщений"),
          ]),
        ]),
      ]),
    ]);
    item.addEventListener("click", () => openChat(chat.chatId));
    return item;
  }

  function renderAvatar(chat, target) {
    const avatar = target ?? h("div", { className: "avatar" });
    avatar.textContent = initials(chat);
    avatar.style.background = AVATAR_COLORS[Math.abs(chat.chatId) % AVATAR_COLORS.length];
    return avatar;
  }

  // ---------- Conversation ----------

  function openChat(chatId) {
    if (location.hash !== `#${chatId}`) {
      // Goes through the hashchange listener, so back/forward and reloads work too.
      location.hash = String(chatId);
      return;
    }
    if (state.activeChatId !== null) state.drafts.set(state.activeChatId, el.input.value);

    state.activeChatId = chatId;
    el.app.classList.add("chat-open");
    el.placeholder.hidden = true;
    el.chat.hidden = false;
    el.error.hidden = true;
    el.input.value = state.drafts.get(chatId) ?? "";
    autosizeInput();
    updateSendButton();

    renderChatHeader();
    renderChatList();
    renderMessages({ forceScroll: true });
    loadMessages(chatId).catch((error) => {
      reportLoadError(error);
      el.messages.replaceChildren(h("div", { className: "messages-empty", textContent: "Не удалось загрузить сообщения" }));
    });
    if (window.matchMedia("(min-width: 721px)").matches) el.input.focus();
  }

  function closeChat() {
    if (state.activeChatId !== null) state.drafts.set(state.activeChatId, el.input.value);
    state.activeChatId = null;
    el.app.classList.remove("chat-open");
    el.chat.hidden = true;
    el.placeholder.hidden = false;
    renderChatList();
  }

  function renderChatHeader() {
    const chatId = state.activeChatId;
    const chat = state.chats.get(chatId) ?? { chatId, firstName: null, lastName: null };
    renderAvatar(chat, el.chatAvatar);
    el.chatName.textContent = displayName(chat);
    el.chatMeta.textContent = `ID ${chatId}`;
  }

  function renderMessages({ forceScroll = false } = {}) {
    const container = el.messages;
    const messages = state.messages.get(state.activeChatId);
    if (!messages) {
      container.replaceChildren(h("div", { className: "messages-empty", textContent: "Загрузка…" }));
      return;
    }

    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    // Each stored row holds up to two bubbles: the user's text and the bot's reply to it
    // (an operator message has only the latter). Ordered by when each was actually sent.
    const bubbles = [];
    for (const message of messages.values()) {
      if (message.text !== null) bubbles.push({ out: false, text: message.text, at: message.createdAt });
      if (message.replyText !== null) {
        bubbles.push({ out: true, text: message.replyText, at: message.repliedAt ?? message.createdAt });
      }
    }
    bubbles.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

    if (bubbles.length === 0) {
      container.replaceChildren(h("div", { className: "messages-empty", textContent: "Сообщений пока нет" }));
      return;
    }

    const nodes = [];
    let lastDay = null;
    for (const bubble of bubbles) {
      const date = new Date(bubble.at);
      const day = date.toDateString();
      if (day !== lastDay) {
        nodes.push(h("div", { className: "day", textContent: formatDay(date) }));
        lastDay = day;
      }
      nodes.push(
        h("div", { className: `bubble ${bubble.out ? "out" : "in"}` }, [
          document.createTextNode(bubble.text),
          h("span", { className: "bubble-meta", textContent: formatTime(date) + (bubble.out ? " ✓✓" : "") }),
        ]),
      );
    }
    container.replaceChildren(...nodes);

    if (forceScroll || nearBottom) container.scrollTop = container.scrollHeight;
  }

  // ---------- Composer ----------

  async function send() {
    const chatId = state.activeChatId;
    const text = el.input.value.trim();
    if (chatId === null || !text || state.sending) return;

    state.sending = true;
    updateSendButton();
    el.error.hidden = true;

    try {
      const message = await api(`/chats/${encodeURIComponent(chatId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      // The same message also arrives over SSE; both paths upsert by id.
      upsertMessage(message);
      const chat = state.chats.get(chatId);
      if (chat) {
        upsertChat({ ...chat, lastMessageAt: message.createdAt, lastMessageText: text, lastMessageFromBot: true });
      }
      state.drafts.delete(chatId);
      if (state.activeChatId === chatId) {
        el.input.value = "";
        autosizeInput();
        renderMessages({ forceScroll: true });
      }
    } catch (error) {
      el.error.textContent = `Не отправлено: ${error.message}`;
      el.error.hidden = false;
    } finally {
      state.sending = false;
      updateSendButton();
      el.input.focus();
    }
  }

  function updateSendButton() {
    el.send.disabled = state.sending || el.input.value.trim().length === 0;
  }

  function autosizeInput() {
    el.input.style.height = "auto";
    el.input.style.height = `${el.input.scrollHeight}px`;
  }

  // ---------- Formatting helpers ----------

  function displayName(chat) {
    const name = [chat.firstName, chat.lastName].filter(Boolean).join(" ");
    return name || `Чат ${chat.chatId}`;
  }

  function initials(chat) {
    const letters = [chat.firstName, chat.lastName].filter(Boolean).map((part) => [...part][0]);
    return (letters.join("") || "#").toUpperCase();
  }

  function formatTime(date) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  function formatListTime(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return formatTime(date);
    const sixDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    if (date >= sixDaysAgo) return date.toLocaleDateString("ru-RU", { weekday: "short" });
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  function formatDay(date) {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Сегодня";
    if (date.toDateString() === yesterday.toDateString()) return "Вчера";
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
    });
  }

  // Tiny element builder; text always goes through textContent/text nodes, never innerHTML.
  function h(tag, props, children) {
    const node = Object.assign(document.createElement(tag), props);
    if (children) node.append(...children.filter(Boolean));
    return node;
  }

  // ---------- Wiring ----------

  function chatIdFromHash() {
    const id = Number(location.hash.slice(1));
    return location.hash.length > 1 && Number.isSafeInteger(id) ? id : null;
  }

  function applyHash() {
    const chatId = chatIdFromHash();
    if (chatId === null) closeChat();
    else if (chatId !== state.activeChatId) openChat(chatId);
  }

  el.search.addEventListener("input", () => {
    state.search = el.search.value;
    renderChatList();
  });

  el.back.addEventListener("click", () => {
    history.replaceState(null, "", location.pathname);
    closeChat();
  });

  el.input.addEventListener("input", () => {
    autosizeInput();
    updateSendButton();
  });

  el.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      send();
    }
  });

  el.composer.addEventListener("submit", (event) => {
    event.preventDefault();
    send();
  });

  window.addEventListener("hashchange", applyHash);

  loadChats().catch(reportLoadError);
  applyHash();
  connect();
})();
