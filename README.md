# FLASH Express

واجهة responsive مبنية بـ React + TypeScript + Vite، مستوحاة من التصميم المرفق: dark mode، أخضر FLASH، RTL، وبنية Mobile First.

## التشغيل

```bash
npm install
npm run dev
```

```bash
npm run build
```

الشاشات الحالية: لوحة العميل، تتبع الطلبات، الشحن الدولي، المحفظة، الملف الشخصي، ونموذج «اطلب لي». التطبيق يستخدم جلسات دخول آمنة عبر Cookie HttpOnly، وواجهة API مبنية بـ NestJS وPrisma متصلة بـ Supabase/PostgreSQL. تم تجهيز manifest للتثبيت كتطبيق PWA.

## قاعدة البيانات

تم تجهيز Prisma Schema لـ PostgreSQL/Supabase داخل `packages/database/prisma/schema.prisma`.

بعد وضع بيانات Supabase في `packages/database/.env` شغّل:

```bash
npm install
npm run db:generate
npm run db:validate
npm run db:migrate
```

لا تضع بيانات Supabase أو كلمات المرور داخل Git.
