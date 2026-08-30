import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaService } from './prisma.service'
import { AuthController, AuthService } from './auth.controller'
import { WebsiteOrdersController } from './website-orders.controller'
import { AdminController } from './admin.controller'
import { JwtGuard, AdminGuard } from './auth'

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'development-only-change-me', signOptions: { expiresIn: 900 } })], controllers: [AuthController, WebsiteOrdersController, AdminController], providers: [PrismaService, AuthService, JwtGuard, AdminGuard] })
export class AppModule {}
