import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { PrismaService } from './prisma.service'
import { AdminGuard, AuthRequest, JwtGuard } from './auth'

const allowedStatuses = ['NEW', 'WAITING_FOR_PRICING', 'PRICED', 'PENDING_PAYMENT', 'PURCHASING', 'SHIPPING', 'READY_FOR_DELIVERY', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const
class StatusDto { @IsString() @IsIn(allowedStatuses) status!: (typeof allowedStatuses)[number]; @IsOptional() @IsNumber() @Min(0) quotedPrice?: number }
@Controller('admin')
@UseGuards(JwtGuard, AdminGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('dashboard') async dashboard() { const [customers, requests, orders] = await Promise.all([this.prisma.customer.count({ where: { deletedAt: null } }), this.prisma.websiteOrderRequest.count({ where: { deletedAt: null } }), this.prisma.order.count({ where: { deletedAt: null } })]); return { success: true, message: 'ملخص لوحة الإدارة', data: { customers, requests, orders } } }
  @Get('website-orders') async list() { const data = await this.prisma.websiteOrderRequest.findMany({ where: { deletedAt: null }, include: { user: { select: { phone: true, name: true } }, items: true }, orderBy: { createdAt: 'desc' } }); return { success: true, message: 'طلبات اطلب لي', data } }
  @Patch('website-orders/:id/status') async update(@Param('id') id: string, @Body() body: StatusDto, @Req() request: AuthRequest) { const data = await this.prisma.websiteOrderRequest.update({ where: { id }, data: { status: body.status, ...(body.quotedPrice !== undefined ? { quotedPrice: body.quotedPrice, paymentRequested: true } : {}) }, include: { user: { select: { phone: true, name: true } }, items: true } }); await this.prisma.auditLog.create({ data: { userId: request.user!.id, action: 'UPDATE_STATUS', entity: 'WebsiteOrderRequest', entityId: id, metadata: { status: body.status, quotedPrice: body.quotedPrice } } }); return { success: true, message: 'تم تحديث حالة الطلب', data } }
}
