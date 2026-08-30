import 'reflect-metadata'
import 'dotenv/config'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',').map((value) => value.trim()) || ['http://localhost:5174'], credentials: true })
  await app.listen(Number(process.env.PORT || 3000))
}
bootstrap()
