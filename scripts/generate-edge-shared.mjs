#!/usr/bin/env node
// Regenerates supabase/functions/_shared/ from src/. See docs/modules/edge-functions.md
// ("Один источник бизнес-логики для двух рантаймов").
//
// The domain/application/adapters-in layers of the bot/currency/student modules are plain,
// framework-agnostic TypeScript (no Node-only APIs) — their state ports are async
// (core/user-mode/user-mode.port.ts and friends) specifically so the same file content
// works unchanged under both Node (this app) and Deno (the Supabase edge functions in
// supabase/functions/). The only real difference is module syntax: Node/tsc resolves
// extensionless relative imports and bare package names, Deno requires an explicit ".ts"
// extension on relative imports and an "npm:" specifier (with a pinned version) for npm
// packages.
//
// Rather than hand-maintaining two copies — which drifts silently (this project already
// shipped one controller-ordering bug that only got fixed in one of the two copies) — this
// script copies each file in SHARED_FILES from src/ to supabase/functions/_shared/,
// mechanically rewriting only that syntax difference. Anything NOT in this list (in-memory
// adapters, Fastify/grammY-polling wiring, main.ts, Postgres-backed adapters, Deno.serve
// entry points, ...) is genuinely different between the two runtimes and stays hand-written
// directly under supabase/functions/.
//
// Run after changing anything under SHARED_FILES, then redeploy the affected function(s):
//   pnpm sync:edge
//   supabase functions deploy bot

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC_ROOT = join(ROOT, "src");
const OUT_ROOT = join(ROOT, "supabase", "functions", "_shared");

// Bare npm specifiers used by shared files, mapped to their Deno "npm:" equivalent.
// Keep the version here in sync with package.json by hand — there's only one entry so far,
// not worth scripting.
const NPM_SPECIFIERS = {
  grammy: "npm:grammy@1.46.0",
};

// Paths are relative to src/ and supabase/functions/_shared/ alike — the two trees mirror
// each other exactly so that copying a file's contents needs no path rewriting beyond the
// mechanical rules in transform().
const SHARED_FILES = [
  "core/domain/domain-exception.ts",
  "core/user-mode/bot-mode.ts",
  "core/user-mode/user-mode.port.ts",

  "modules/bot/domain/bot-command.entity.ts",
  "modules/bot/domain/chat-message.entity.ts",
  "modules/bot/domain/exceptions/empty-message-text.exception.ts",
  "modules/bot/domain/exceptions/invalid-command-format.exception.ts",
  "modules/bot/application/ports/update-logger.port.ts",
  "modules/bot/application/use-cases/receive-command.use-case.ts",
  "modules/bot/application/use-cases/receive-message.use-case.ts",
  "modules/bot/application/use-cases/switch-mode.use-case.ts",
  "modules/bot/adapters/out/console-update-logger.adapter.ts",
  "modules/bot/adapters/in/telegram-bot.controller.ts",
  "modules/bot/adapters/in/menu-bot.controller.ts",
  "modules/bot/adapters/in/debug-bot.controller.ts",

  "modules/currency/domain/currency-alias.dictionary.ts",
  "modules/currency/domain/exchange-rate-source.ts",
  "modules/currency/domain/parsed-amount.ts",
  "modules/currency/domain/exceptions/exchange-rate-api.exception.ts",
  "modules/currency/domain/exceptions/exchange-rate-source-unchanged.exception.ts",
  "modules/currency/domain/exceptions/unsupported-currency-by-source.exception.ts",
  "modules/currency/application/ports/exchange-rate.port.ts",
  "modules/currency/application/ports/exchange-rate-source-preference.port.ts",
  "modules/currency/application/ports/target-currency-preference.port.ts",
  "modules/currency/application/services/currency-text-parser.service.ts",
  "modules/currency/application/use-cases/convert-amount.use-case.ts",
  "modules/currency/application/use-cases/switch-exchange-rate-source.use-case.ts",
  "modules/currency/adapters/out/exchange-rate-api.adapter.ts",
  "modules/currency/adapters/out/frankfurter-exchange-rate.adapter.ts",
  "modules/currency/adapters/out/exchange-rate-router.adapter.ts",
  "modules/currency/adapters/in/currency-bot.controller.ts",
  "modules/currency/adapters/in/currency-source-bot.controller.ts",

  "modules/student/domain/student-info.ts",
  "modules/student/application/use-cases/get-student-info.use-case.ts",
  "modules/student/adapters/in/student-bot.controller.ts",
];

function transform(source) {
  let out = source.replace(/from\s+"(\.\.?\/[^"]+)"/g, (match, spec) =>
    spec.endsWith(".ts") ? match : match.replace(spec, `${spec}.ts`),
  );

  for (const [bareSpecifier, npmSpecifier] of Object.entries(NPM_SPECIFIERS)) {
    out = out.replaceAll(`from "${bareSpecifier}"`, `from "${npmSpecifier}"`);
  }

  return out;
}

let count = 0;
for (const relPath of SHARED_FILES) {
  const source = readFileSync(join(SRC_ROOT, relPath), "utf8");
  const header = `// GENERATED FILE — do not edit directly, edit src/${relPath} instead.\n// Regenerate with: pnpm sync:edge\n\n`;
  const outPath = join(OUT_ROOT, relPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, header + transform(source));
  count++;
}

console.log(`Generated ${count} file(s) into supabase/functions/_shared/ from src/.`);
