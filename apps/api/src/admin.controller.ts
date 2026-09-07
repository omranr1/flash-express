import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, Matches, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PrismaService } from './prisma.service'
import { AdminGuard, AuthRequest, JwtGuard } from './auth'

const allowedStatuses = ['NEW', 'WAITING_FOR_PRICING', 'PRICED', 'PENDING_PAYMENT', 'PURCHASING', 'SHIPPING', 'READY_FOR_DELIVERY', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const
class StatusDto { @IsString() @IsIn(allowedStatuses) status!: (typeof allowedStatuses)[number]; @IsOptional() @IsNumber() @Min(0) quotedPrice?: number }
class AdminItemDto { @IsUrl({ protocols: ['http', 'https'] }) productUrl!: string; @IsString() productName!: string; @IsInt() @Min(1) quantity!: number; @IsOptional() @IsString() color?: string; @IsOptional() @IsString() size?: string; @IsOptional() @IsString() notes?: string }
class AdminCreateRequestDto { @IsString() @Matches(/^\\+?[0-9 ]{8,20}$/) phone!: string; @IsString() name!: string; @IsString() city!: string; @IsString() address!: string; @IsOptional() @IsString() notes?: string; @ValidateNested({ each: true }) @Type(() => AdminItemDto) items!: AdminItemDto[] }
@Controller('admin')
@UseGuards(JwtGuard, AdminGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('dashboard') async dashboard() { const [customers, requests, orders] = await Promise.all([this.prisma.customer.count({ where: { deletedAt: null } }), this.prisma.websiteOrderRequest.count({ where: { deletedAt: null } }), this.prisma.order.count({ where: { deletedAt: null } })]); return { success: true, message: 'ملخص لوحة الإدارة', data: { customers, requests, orders } } }
  @Get('customers') async customers() { const data = await this.prisma.customer.findMany({ where: { deletedAt: null, user: { deletedAt: null } }, include: { user: { select: { name: true, phone: true, isActive: true, createdAt: true } } }, orderBy: { createdAt: 'desc' } }); return { success: true, message: 'قائمة العملاء', data } }
  @Get('website-orders') async list() { const data = await this.prisma.websiteOrderRequest.findMany({ where: { deletedAt: null }, include: { user: { select: { phone: true, name: true } }, items: true }, orderBy: { createdAt: 'desc' } }); return { success: true, message: 'طلبات اطلب لي', data } }
  @Post('website-orders') async create(@Body() body: AdminCreateRequestDto) {
    const user = await this.prisma.user.upsert({ where: { phone: body.phone }, update: { name: body.name, isVerified: true }, create: { phone: body.phone, name: body.name, isVerified: true, customer: { create: { phone: body.phone } }, wallet: { create: {} } } })
    const data = await this.prisma.websiteOrderRequest.create({ data: { requestNumber: `REQ-${Date.now()}`, userId: user.id, city: body.city, address: body.address, notes: body.notes, items: { create: body.items } }, include: { user: { select: { phone: true, name: true } }, items: true } })
    return { success: true, message: 'تمت إضافة الطلب', data }
  }
  @Patch('website-orders/:id/status') async update(@Param('id') id: string, @Body() body: StatusDto, @Req() request: AuthRequest) { const data = await this.prisma.websiteOrderRequest.update({ where: { id }, data: { status: body.status, ...(body.quotedPrice !== undefined ? { quotedPrice: body.quotedPrice, paymentRequested: false } : {}) }, include: { user: { select: { id: true, phone: true, name: true } }, items: true } }); if (body.quotedPrice !== undefined) await this.prisma.notification.create({ data: { userId: data.user.id, title: 'تم تسعير طلبك', message: `تم تحديد سعر طلبك ${data.requestNumber} بمبلغ ${body.quotedPrice} د.ل. افتح الطلب لتأكيد الدفع.` } }); await this.prisma.auditLog.create({ data: { userId: request.user!.id, action: body.quotedPrice !== undefined ? 'SEND_QUOTE' : 'UPDATE_STATUS', entity: 'WebsiteOrderRequest', entityId: id, metadata: { status: body.status, quotedPrice: body.quotedPrice } } }); return { success: true, message: body.quotedPrice !== undefined ? 'تم إرسال السعر للعميل' : 'تم تحديث حالة الطلب', data } }
}
