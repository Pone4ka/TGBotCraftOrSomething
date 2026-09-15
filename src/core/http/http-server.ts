import Fastify, { type FastifyInstance } from "fastify";
import { registerHealthRoutes } from "../health/health.controller";

export function createHttpServer(): FastifyInstance {
  const app = Fastify({ logger: true });
  registerHealthRoutes(app);
  return app;
}
