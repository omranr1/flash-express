import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { IsInt, IsString, IsUrl, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PrismaService } from './prisma.service'
import { AuthRequest, JwtGuard } from './auth'
import { OrderEventsService } from './order-events.service'

class ItemDto { @IsUrl({ protocols: ['http', 'https'] }) productUrl!: string; @IsString() productName!: string; @IsInt() @Min(1) quantity!: number; @IsString() color!: string; @IsString() size!: string }
class CreateRequestDto { @IsString() city!: string; @IsString() address!: string; @ValidateNested({ each: true }) @Type(() => ItemDto) items!: ItemDto[] }

@Controller('website-orders')
@UseGuards(JwtGuard)
export class WebsiteOrdersController {
  constructor(private readonly prisma: PrismaService, private readonly events: OrderEventsService) {}
  @Post()
  async create(@Req() request: AuthRequest, @Body() body: CreateRequestDto) {
    const result = await this.prisma.websiteOrderRequest.create({ data: { requestNumber: `REQ-${Date.now()}`, userId: request.user!.id, city: body.city, address: body.address, items: { create: body.items } }, include: { items: true } })
    return { success: true, message: 'تم إرسال الطلب إلى فريق FLASH', data: result }
  }
  @Get('my')
  async mine(@Req() request: AuthRequest) { const data = await this.prisma.websiteOrderRequest.findMany({ where: { userId: request.user!.id, deletedAt: null }, include: { items: true }, orderBy: { createdAt: 'desc' } }); return { success: true, message: 'طلباتك', data } }
  @Get('summary')
  async summary(@Req() request: AuthRequest) {
    const [purchases, activePurchases, shipments, wallet] = await Promise.all([
      this.prisma.websiteOrderRequest.count({ where: { userId: request.user!.id, deletedAt: null } }),
      this.prisma.websiteOrderRequest.count({ where: { userId: request.user!.id, deletedAt: null, status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] } } }),
      this.prisma.order.count({ where: { userId: request.user!.id, deletedAt: null } }),
      this.prisma.wallet.findUnique({ where: { userId: request.user!.id }, select: { balance: true } }),
    ])
    return { success: true, message: 'ملخص الحساب', data: { internationalShipments: shipments, localShipments: 0, purchases, activePurchases, walletBalance: Number(wallet?.balance || 0), points: 0 } }
  }
  @Patch(':id/payment-confirmation')
  async paymentConfirmation(@Req() request: AuthRequest, @Param('id') id: string) { const owned = await this.prisma.websiteOrderRequest.findFirst({ where: { id, userId: request.user!.id, deletedAt: null } }); if (!owned) return { success: false, message: 'الطلب غير موجود', data: null }; const data = await this.prisma.websiteOrderRequest.update({ where: { id }, data: { status: 'PENDING_PAYMENT', paymentRequested: true } }); this.events.emit(request.user!.id, { type: 'order-updated', orderId: id, status: 'PENDING_PAYMENT' }); return { success: true, message: 'تم إرسال تأكيد الدفع', data } }
}
