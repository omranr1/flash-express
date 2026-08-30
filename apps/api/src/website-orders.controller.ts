import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { IsInt, IsString, IsUrl, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PrismaService } from './prisma.service'
import { AuthRequest, JwtGuard } from './auth'

class ItemDto { @IsUrl({ protocols: ['http', 'https'] }) productUrl!: string; @IsString() productName!: string; @IsInt() @Min(1) quantity!: number; @IsString() color!: string; @IsString() size!: string }
class CreateRequestDto { @IsString() city!: string; @IsString() address!: string; @ValidateNested({ each: true }) @Type(() => ItemDto) items!: ItemDto[] }

@Controller('website-orders')
@UseGuards(JwtGuard)
export class WebsiteOrdersController {
  constructor(private readonly prisma: PrismaService) {}
  @Post()
  async create(@Req() request: AuthRequest, @Body() body: CreateRequestDto) {
    const result = await this.prisma.websiteOrderRequest.create({ data: { requestNumber: `REQ-${Date.now()}`, userId: request.user!.id, city: body.city, address: body.address, items: { create: body.items } }, include: { items: true } })
    return { success: true, message: 'تم إرسال الطلب إلى فريق FLASH', data: result }
  }
  @Get('my')
  async mine(@Req() request: AuthRequest) { const data = await this.prisma.websiteOrderRequest.findMany({ where: { userId: request.user!.id, deletedAt: null }, include: { items: true }, orderBy: { createdAt: 'desc' } }); return { success: true, message: 'طلباتك', data } }
}
