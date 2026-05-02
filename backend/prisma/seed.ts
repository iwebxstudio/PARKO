// ============================================
// PARKO — Database Seed
// Creates default admin, vehicle types, pricing, settings
// ============================================
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Create Admin User ────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@parko.local',
      passwordHash: adminPassword,
      displayName: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user created: ${admin.username}`);

  // ─── Create Staff User ───────────────────
  const staffPassword = await bcrypt.hash('staff123', 12);
  const staff = await prisma.user.upsert({
    where: { username: 'staff01' },
    update: {},
    create: {
      username: 'staff01',
      email: 'staff01@parko.local',
      passwordHash: staffPassword,
      displayName: 'Staff 01',
      role: 'STAFF',
    },
  });
  console.log(`✅ Staff user created: ${staff.username}`);

  // ─── Vehicle Types ───────────────────────
  const vehicleTypes = [
    { name: 'car', label: 'ລົດໃຫຍ່', icon: '🚗', description: 'Car / ລົດໃຫຍ່', sortOrder: 1 },
    { name: 'motorcycle', label: 'ລົດຈັກ', icon: '🏍️', description: 'Motorcycle / ລົດຈັກ', sortOrder: 2 },
    { name: 'ev_motorcycle', label: 'ລົດຈັກໄຟຟ້າ', icon: '⚡', description: 'EV Motorcycle / ລົດຈັກໄຟຟ້າ', sortOrder: 3 },
    { name: 'truck', label: 'ລົດບັນທຸກ', icon: '🚛', description: 'Truck / ລົດບັນທຸກ', sortOrder: 4 },
  ];

  for (const vt of vehicleTypes) {
    await prisma.vehicleType.upsert({
      where: { name: vt.name },
      update: {},
      create: vt,
    });
  }
  console.log('✅ Vehicle types created');

  // ─── Get vehicle types for pricing ──────
  const allTypes = await prisma.vehicleType.findMany();

  // ─── Default Pricing Rules (LAK) ────────
  const defaultPricing = [
    { name: 'car', hourly: 5000, daily: 30000, weekly: 150000, monthly: 500000, free: 15 },
    { name: 'motorcycle', hourly: 3000, daily: 15000, weekly: 80000, monthly: 250000, free: 15 },
    { name: 'ev_motorcycle', hourly: 3000, daily: 15000, weekly: 80000, monthly: 250000, free: 15 },
    { name: 'truck', hourly: 10000, daily: 60000, weekly: 300000, monthly: 1000000, free: 15 },
  ];

  for (const dp of defaultPricing) {
    const vt = allTypes.find((t) => t.name === dp.name);
    if (!vt) continue;

    // Check if pricing rule already exists
    const existing = await prisma.pricingRule.findFirst({
      where: { vehicleTypeId: vt.id, isActive: true },
    });

    if (!existing) {
      await prisma.pricingRule.create({
        data: {
          vehicleTypeId: vt.id,
          pricingType: 'HOURLY',
          basePrice: 0,
          hourlyRate: dp.hourly,
          dailyRate: dp.daily,
          weeklyRate: dp.weekly,
          monthlyRate: dp.monthly,
          freeMinutes: dp.free,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Default pricing rules created (LAK)');

  // ─── System Settings ────────────────────
  const settings = [
    {
      key: 'parking_name',
      value: { name: 'PARKO Parking', subtitle: 'ລານຈອດລົດ PARKO' },
      description: 'Parking lot name displayed on receipts and UI',
    },
    {
      key: 'currency',
      value: { code: 'LAK', symbol: '₭', name: 'Lao Kip' },
      description: 'System currency',
    },
    {
      key: 'qr_payment_image',
      value: { url: '', enabled: false },
      description: 'QR code image for payment (upload your own)',
    },
    {
      key: 'parking_logo',
      value: { url: '', enabled: false },
      description: 'Parking logo for receipts and UI',
    },
    {
      key: 'receipt_footer',
      value: { text: 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ / Thank you for using our service' },
      description: 'Footer text on printed receipts',
    },
    {
      key: 'printer_config',
      value: { type: 'bluetooth', paperWidth: 58, encoding: 'UTF-8' },
      description: 'Thermal printer configuration',
    },
    {
      key: 'parking_capacity',
      value: { limit: 0, threshold: 0.9 },
      description: 'Optional parking capacity limit (0 = unlimited). Emits alert when threshold is reached.',
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value,
        description: s.description,
        updatedById: admin.id,
      },
    });
  }
  console.log('✅ System settings created');

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('─────────────────────────────────');
  console.log('Admin login:  admin / admin123');
  console.log('Staff login:  staff01 / staff123');
  console.log('Currency:     LAK (₭ Lao Kip)');
  console.log('─────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
