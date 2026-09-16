import { createStudentModule } from "../_shared/modules/student/student.module.ts";

// Entry point 1 of 2 for the student module: a plain GET, equivalent to the Node app's
// `GET /student` Fastify route (see adapters/in/student.controller.ts).
// Entry point 2 lives in the `bot` function: student.botController.registerHandlers(bot)
// answers the same GetStudentInfoUseCase through Telegram (the "🎓 Студент" button).
const student = createStudentModule();

Deno.serve((req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
  }

  return Response.json(student.getStudentInfo.execute());
});
