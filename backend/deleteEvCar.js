const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.vehicleType.delete({
  where: { name: 'ev_car' }
}).then(() => console.log('Deleted')).catch(console.error).finally(() => prisma.$disconnect());
