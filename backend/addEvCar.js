const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.vehicleType.create({
  data: {
    name: 'ev_car',
    label: 'ລົດໃຫຍ່ໄຟຟ້າ',
    icon: 'ev_car'
  }
}).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
