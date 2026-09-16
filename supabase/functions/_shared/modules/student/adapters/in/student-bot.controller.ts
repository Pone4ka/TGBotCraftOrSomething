import type { Bot } from "npm:grammy@1.46.0";
import type { GetStudentInfoUseCase } from "../../application/use-cases/get-student-info.use-case.ts";

// Label for the "student info" button on the home keyboard (built in MenuBotController);
// exported so that keyboard can reuse the exact same text.
export const STUDENT_INFO_LABEL = "🎓 Студент";

// Second entry point into the student module (the first is the direct GET handled by the
// `student` edge function itself): this one answers through the `bot` edge function's
// Telegram webhook.
export class StudentBotController {
  constructor(private readonly getStudentInfo: GetStudentInfoUseCase) {}

  registerHandlers(bot: Bot): void {
    bot.hears(STUDENT_INFO_LABEL, async (ctx) => {
      const info = this.getStudentInfo.execute();
      await ctx.reply(`${info.message}, studentId: ${info.studentId}`);
    });
  }
}
