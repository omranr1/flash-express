import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { AuthRequest, JwtGuard } from './auth'

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('my')
  async mine(@Req() request: AuthRequest) {
    const data = await this.prisma.notification.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 })
    return { success: true, message: 'إشعاراتك', data }
  }

  @Patch(':id/read')
  async markRead(@Req() request: AuthRequest, @Param('id') id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId: request.user!.id } })
    if (!notification) return { success: false, message: 'الإشعار غير موجود', data: null }
    const data = await this.prisma.notification.update({ where: { id }, data: { isRead: true } })
    return { success: true, message: 'تم تعليم الإشعار كمقروء', data }
  }
}
