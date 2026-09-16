import { StudentBotController } from "./adapters/in/student-bot.controller.ts";
import { GetStudentInfoUseCase } from "./application/use-cases/get-student-info.use-case.ts";

export interface StudentModule {
  getStudentInfo: GetStudentInfoUseCase;
  botController: StudentBotController;
}

export function createStudentModule(): StudentModule {
  const getStudentInfo = new GetStudentInfoUseCase();
  const botController = new StudentBotController(getStudentInfo);

  return { getStudentInfo, botController };
}
