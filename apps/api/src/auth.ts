import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'

export type AuthRequest = Request & { user?: { id: string; role: string } }

function readCookie(request: Request, name: string) {
  const cookies = request.headers.cookie?.split(';').map((cookie) => cookie.trim()) || []
  return cookies.find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1)
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>()
    const authorization = request.headers.authorization
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : readCookie(request, 'flash_access_token')
    if (!token) throw new UnauthorizedException('تسجيل الدخول مطلوب')
    try { request.user = this.jwt.verify<{ id: string; role: string }>(token); return true } catch { throw new UnauthorizedException('جلسة الدخول غير صالحة') }
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) { const user = context.switchToHttp().getRequest<AuthRequest>().user; if (!user || !['ADMIN', 'STAFF'].includes(user.role)) throw new ForbiddenException('ليس لديك صلاحية الإدارة'); return true }
}
