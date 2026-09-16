// GENERATED FILE — do not edit directly, edit src/modules/student/application/use-cases/get-student-info.use-case.ts instead.
// Regenerate with: pnpm sync:edge

import type { StudentInfo } from "../../domain/student-info.ts";

const STUDENT_ID = 6914;

export class GetStudentInfoUseCase {
  execute(): StudentInfo {
    return { message: "hello, it-incubator", studentId: STUDENT_ID };
  }
}
