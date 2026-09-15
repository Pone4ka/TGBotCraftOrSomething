import { Module } from "@nestjs/common";
import { StudentController } from "./adapters/in/student.controller";
import { GetStudentInfoUseCase } from "./application/use-cases/get-student-info.use-case";

@Module({
  controllers: [StudentController],
  providers: [GetStudentInfoUseCase],
})
export class StudentModule {}
