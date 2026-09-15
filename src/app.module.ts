import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateConfig } from "./core/config";
import { HealthController } from "./core/health/health.controller";
import { BotModule } from "./modules/bot/bot.module";
import { StudentModule } from "./modules/student/student.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    BotModule,
    StudentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
