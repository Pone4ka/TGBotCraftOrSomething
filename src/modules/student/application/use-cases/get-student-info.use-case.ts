import { Injectable } from "@nestjs/common";
import type { StudentInfo } from "../../domain/student-info";

const STUDENT_ID = 6914;

@Injectable()
export class GetStudentInfoUseCase {
  execute(): StudentInfo {
    return { message: "hello", studentId: STUDENT_ID };
  }
}
