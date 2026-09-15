import { Controller, Get } from "@nestjs/common";
import type { StudentInfo } from "../../domain/student-info";
import { GetStudentInfoUseCase } from "../../application/use-cases/get-student-info.use-case";

@Controller("student")
export class StudentController {
  constructor(private readonly getStudentInfo: GetStudentInfoUseCase) {}

  @Get()
  getInfo(): StudentInfo {
    return this.getStudentInfo.execute();
  }
}
