import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get()
  checkRoot(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("health")
  checkHealth(): { status: "ok" } {
    return { status: "ok" };
  }
}
