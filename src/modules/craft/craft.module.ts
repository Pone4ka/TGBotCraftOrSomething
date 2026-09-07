import { Module } from "@nestjs/common";
import { UserModeModule } from "../../core/user-mode/user-mode.module";
import { CraftBotController } from "./adapters/in/craft-bot.controller";

@Module({
  imports: [UserModeModule],
  providers: [CraftBotController],
  exports: [CraftBotController],
})
export class CraftModule {}
