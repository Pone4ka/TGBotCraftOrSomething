import { Module } from "@nestjs/common";
import { StudentController } from "./adapters/in/student.controller";
import { StudentBotController } from "./adapters/in/student-bot.controller";
import { GetStudentInfoUseCase } from "./application/use-cases/get-student-info.use-case";

@Module({
  controllers: [StudentController],
  providers: [GetStudentInfoUseCase, StudentBotController],
  exports: [StudentBotController],
})
export class StudentModule {}
