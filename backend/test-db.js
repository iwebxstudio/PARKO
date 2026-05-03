const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.systemSetting.updateMany({
    where: { key: 'parking_logo' },
    data: { value: { url: '/uploads/logo.png', enabled: true } }
  });
  await prisma.systemSetting.updateMany({
    where: { key: 'qr_payment_image' },
    data: { value: { url: '/uploads/qr_payment.png', enabled: true } }
  });
  console.log("Updated DB with new image paths.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
