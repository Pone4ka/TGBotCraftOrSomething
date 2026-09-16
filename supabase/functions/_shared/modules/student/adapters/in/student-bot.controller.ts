// GENERATED FILE — do not edit directly, edit src/modules/student/adapters/in/student-bot.controller.ts instead.
// Regenerate with: pnpm sync:edge

import type { Bot } from "npm:grammy@1.46.0";
import { GetStudentInfoUseCase } from "../../application/use-cases/get-student-info.use-case.ts";

// Label for the "student info" button on the home keyboard (built in MenuBotController);
// exported so that keyboard can reuse the exact same text.
export const STUDENT_INFO_LABEL = "🎓 Студент";

export class StudentBotController {
  constructor(private readonly getStudentInfo: GetStudentInfoUseCase) {}

  registerHandlers(bot: Bot): void {
    bot.hears(STUDENT_INFO_LABEL, async (ctx) => {
      const info = this.getStudentInfo.execute();
      await ctx.reply(`${info.message}, studentId: ${info.studentId}`);
    });
  }
}
