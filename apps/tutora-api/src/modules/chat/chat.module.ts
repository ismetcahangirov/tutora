import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatPresenceService } from './chat.presence';
import { ChatRealtime } from './chat.realtime';
import { ChatService } from './chat.service';

/**
 * Realtime chat (#34). Imports AuthModule for JwtService (WS handshake auth) and
 * the route guards. PrismaService and ConfigService are globally provided.
 */
@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatRealtime, ChatPresenceService],
})
export class ChatModule {}
