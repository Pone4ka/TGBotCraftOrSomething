import type { FastifyInstance } from "fastify";

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/", async () => ({ status: "ok" }));
  app.get("/health", async () => ({ status: "ok" }));
}
