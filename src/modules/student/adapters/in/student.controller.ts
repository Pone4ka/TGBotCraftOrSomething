import type { FastifyInstance } from "fastify";
import { GetStudentInfoUseCase } from "../../application/use-cases/get-student-info.use-case";

export function registerStudentRoutes(app: FastifyInstance, getStudentInfo: GetStudentInfoUseCase): void {
  app.get("/student", async () => getStudentInfo.execute());
}
