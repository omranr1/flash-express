import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaService } from './prisma.service'
import { AuthController, AuthService } from './auth.controller'
import { WebsiteOrdersController } from './website-orders.controller'
import { AdminController } from './admin.controller'
import { NotificationsController } from './notifications.controller'
import { OrderEventsService } from './order-events.service'

const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET is required in production') })() : 'development-only-change-me')
import { JwtGuard, AdminGuard } from './auth'

@Module({ imports: [JwtModule.register({ secret: jwtSecret, signOptions: { expiresIn: 60 * 60 * 24 * 180 } })], controllers: [AuthController, WebsiteOrdersController, AdminController, NotificationsController], providers: [PrismaService, AuthService, JwtGuard, AdminGuard, OrderEventsService] })
export class AppModule {}
