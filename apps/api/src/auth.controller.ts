import { Body, Controller, Get, Injectable, Post, Res, UseGuards } from '@nestjs/common'
import { IsString, Matches, MinLength } from 'class-validator'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from './prisma.service'
import { JwtGuard, AuthRequest } from './auth'
import { Req } from '@nestjs/common'
import type { Response } from 'express'

class PhoneDto { @IsString() @Matches(/^\+?[0-9 ]{8,20}$/) phone!: string }
class RegisterDto extends PhoneDto { @IsString() @MinLength(2) name!: string }
class VerifyDto extends PhoneDto { @IsString() @MinLength(4) code!: string }
class AdminLoginDto { @IsString() username!: string; @IsString() @MinLength(1) password!: string }

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async verify(phone: string, code: string) {
    if (process.env.NODE_ENV === 'production' || code !== '1234') return { success: false, message: 'رمز التحقق غير صحيح', data: null }
    const user = await this.prisma.user.upsert({ where: { phone }, update: { isVerified: true }, create: { phone, isVerified: true, customer: { create: { phone } }, wallet: { create: {} } }, select: { id: true, phone: true, name: true, role: true } })
    return { success: true, message: 'تم تسجيل الدخول', data: { accessToken: this.jwt.sign({ id: user.id, role: user.role }), user } }
  }

  adminLogin(username: string, password: string) {
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) return { success: false, message: 'بيانات الإدارة غير صحيحة', data: null }
    const accessToken = this.jwt.sign({ id: 'admin', role: 'ADMIN' })
    return { success: true, message: 'تم تسجيل دخول الإدارة', data: { accessToken } }
  }

  async register(name: string, phone: string) {
    const user = await this.prisma.user.upsert({ where: { phone }, update: { name, isActive: true }, create: { phone, name, isVerified: false, customer: { create: { phone } }, wallet: { create: {} } }, select: { id: true, phone: true, name: true, role: true, isVerified: true } })
    await this.prisma.customer.upsert({ where: { userId: user.id }, update: { phone }, create: { userId: user.id, phone } })
    await this.prisma.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } })
    return { success: true, message: 'تم تسجيل الحساب', data: { accessToken: this.jwt.sign({ id: user.id, role: user.role }), user } }
  }

  async currentUser(id: string) {
    if (id === 'admin') return null
    return this.prisma.user.findFirst({ where: { id, deletedAt: null, isActive: true }, select: { id: true, phone: true, name: true, role: true, isVerified: true } })
  }

}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Get('health') health() { return { ok: true, service: 'flash-express-api' } }
  @Post('phone-login') phoneLogin(@Body() body: PhoneDto) { return { success: true, message: 'تم إرسال رمز التحقق', data: process.env.NODE_ENV === 'production' ? null : { developmentCode: '1234', phone: body.phone } } }
  @Post('register') async register(@Body() body: RegisterDto, @Res({ passthrough: true }) response: Response) { const result = await this.auth.register(body.name, body.phone); response.cookie('flash_access_token', result.data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 1000 * 60 * 60 * 24 * 180, path: '/' }); return result }
  @Post('verify') async verify(@Body() body: VerifyDto, @Res({ passthrough: true }) response: Response) { const result = await this.auth.verify(body.phone, body.code); if (result.success && result.data) { response.cookie('flash_access_token', result.data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 1000 * 60 * 15, path: '/' }) } return result }
  @Post('admin-login') adminLogin(@Body() body: AdminLoginDto, @Res({ passthrough: true }) response: Response) { const result = this.auth.adminLogin(body.username, body.password); if (result.success && result.data) response.cookie('flash_access_token', result.data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 1000 * 60 * 60 * 24 * 7, path: '/' }); return result }
  @UseGuards(JwtGuard)
  @Get('me') async me(@Req() request: AuthRequest) { const user = await this.auth.currentUser(request.user!.id); return user ? { success: true, message: 'بيانات الحساب', data: user } : { success: false, message: 'الحساب غير موجود', data: null } }
}
