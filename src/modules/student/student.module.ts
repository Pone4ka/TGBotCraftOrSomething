import type { FastifyInstance } from "fastify";
import { registerStudentRoutes } from "./adapters/in/student.controller";
import { StudentBotController } from "./adapters/in/student-bot.controller";
import { GetStudentInfoUseCase } from "./application/use-cases/get-student-info.use-case";

export interface StudentModule {
  botController: StudentBotController;
  registerHttpRoutes: (app: FastifyInstance) => void;
}

export function createStudentModule(): StudentModule {
  const getStudentInfo = new GetStudentInfoUseCase();
  const botController = new StudentBotController(getStudentInfo);

  return {
    botController,
    registerHttpRoutes: (app) => registerStudentRoutes(app, getStudentInfo),
  };
}
