import { Module } from "@nestjs/common";
import { InMemoryUserModeAdapter } from "./in-memory-user-mode.adapter";
import { USER_MODE_PORT } from "./user-mode.port";

@Module({
  providers: [{ provide: USER_MODE_PORT, useClass: InMemoryUserModeAdapter }],
  exports: [USER_MODE_PORT],
})
export class UserModeModule {}
