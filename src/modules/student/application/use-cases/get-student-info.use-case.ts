import type { StudentInfo } from "../../domain/student-info";

const STUDENT_ID = 6914;

export class GetStudentInfoUseCase {
  execute(): StudentInfo {
    return { message: "hello, it-incubator", studentId: STUDENT_ID };
  }
}
