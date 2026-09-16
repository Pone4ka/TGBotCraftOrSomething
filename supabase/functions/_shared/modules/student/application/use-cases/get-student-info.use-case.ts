import type { StudentInfo } from "../../domain/student-info.ts";

const STUDENT_ID = 6914;

export class GetStudentInfoUseCase {
  execute(): StudentInfo {
    return { message: "hello", studentId: STUDENT_ID };
  }
}
