const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('password', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@insurance.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@insurance.com',
      phone: '9999999999',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create Agent User
  const agentPassword = await bcrypt.hash('password', 10);
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@insurance.com' },
    update: {},
    create: {
      name: 'John Agent',
      email: 'agent@insurance.com',
      phone: '9999999998',
      password: agentPassword,
      role: 'AGENT',
      status: 'ACTIVE',
    },
  });

  await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      panNumber: 'ABCDE1234F',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      commissionDefault: 10.00,
      status: 'APPROVED',
    },
  });
  console.log('Agent user created:', agentUser.email);

  // Create Customer User
  const customerPassword = await bcrypt.hash('password', 10);
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@insurance.com' },
    update: {},
    create: {
      name: 'Jane Customer',
      email: 'customer@insurance.com',
      phone: '9999999997',
      password: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
  });
  console.log('Customer user created:', customerUser.email);

  // Create Insurance Categories
  const categories = [
    { name: 'Mobile Insurance', slug: 'mobile-insurance', icon: '📱' },
    { name: 'Electronics Appliances Insurance', slug: 'electronics-appliances-insurance', icon: '🔌' },
    { name: 'Laptop Insurance', slug: 'laptop-insurance', icon: '💻' },
    { name: 'TV Insurance', slug: 'tv-insurance', icon: '📺' },
    { name: 'Car Insurance', slug: 'car-insurance', icon: '🚗' },
    { name: 'Home Insurance', slug: 'home-insurance', icon: '🏠' },
    { name: 'Health Insurance', slug: 'health-insurance', icon: '❤️' },
    { name: 'Travel Insurance', slug: 'travel-insurance', icon: '✈️' },
  ];

  for (const cat of categories) {
    await prisma.insuranceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: `Comprehensive ${cat.name.toLowerCase()} coverage`,
        icon: cat.icon,
        status: 'ACTIVE',
      },
    });
  }
  console.log('Categories created');

  // Create Plans
  const allCategories = await prisma.insuranceCategory.findMany();
  
  for (const category of allCategories) {
    await prisma.insurancePlan.createMany({
      data: [
        {
          categoryId: category.id,
          name: 'Basic Plan',
          description: `Basic coverage for ${category.name}`,
          durationMonths: 12,
          features: JSON.stringify(['Accidental damage', 'Theft protection']),
          status: 'ACTIVE',
        },
        {
          categoryId: category.id,
          name: 'Premium Plan',
          description: `Comprehensive coverage for ${category.name}`,
          durationMonths: 24,
          features: JSON.stringify(['Accidental damage', 'Theft protection', 'Liquid damage', 'Extended warranty']),
          status: 'ACTIVE',
        },
      ],
      skipDuplicates: true,
    });
  }
  console.log('Plans created');

  // Create Brands and Models
  const mobile = await prisma.insuranceCategory.findUnique({ where: { slug: 'mobile-insurance' } });
  const laptop = await prisma.insuranceCategory.findUnique({ where: { slug: 'laptop-insurance' } });
  const car = await prisma.insuranceCategory.findUnique({ where: { slug: 'car-insurance' } });

  if (mobile) {
    const appleBrand = await prisma.brand.create({
      data: { categoryId: mobile.id, name: 'Apple', status: 'ACTIVE' },
    });
    await prisma.deviceModel.createMany({
      data: [
        { brandId: appleBrand.id, name: 'iPhone 15 Pro' },
        { brandId: appleBrand.id, name: 'iPhone 15' },
        { brandId: appleBrand.id, name: 'iPhone 14 Pro' },
      ],
    });

    const samsungBrand = await prisma.brand.create({
      data: { categoryId: mobile.id, name: 'Samsung', status: 'ACTIVE' },
    });
    await prisma.deviceModel.createMany({
      data: [
        { brandId: samsungBrand.id, name: 'Galaxy S24 Ultra' },
        { brandId: samsungBrand.id, name: 'Galaxy S24' },
      ],
    });
  }

  if (laptop) {
    const dellBrand = await prisma.brand.create({
      data: { categoryId: laptop.id, name: 'Dell', status: 'ACTIVE' },
    });
    await prisma.deviceModel.createMany({
      data: [
        { brandId: dellBrand.id, name: 'XPS 15' },
        { brandId: dellBrand.id, name: 'Inspiron 14' },
      ],
    });
  }

  if (car) {
    const marutiBrand = await prisma.brand.create({
      data: { categoryId: car.id, name: 'Maruti Suzuki', status: 'ACTIVE' },
    });
    await prisma.deviceModel.createMany({
      data: [
        { brandId: marutiBrand.id, name: 'Swift' },
        { brandId: marutiBrand.id, name: 'Baleno' },
      ],
    });
  }
  console.log('Brands and models created');

  // Create Addons
  if (mobile) {
    await prisma.addon.createMany({
      data: [
        {
          categoryId: mobile.id,
          name: 'Screen Protection',
          description: 'Extra screen damage coverage',
          priceType: 'FIXED',
          priceValue: 500,
          status: 'ACTIVE',
        },
        {
          categoryId: mobile.id,
          name: 'Water Damage',
          description: 'Liquid damage coverage',
          priceType: 'PERCENT',
          priceValue: 5,
          status: 'ACTIVE',
        },
      ],
    });
  }

  if (laptop) {
    await prisma.addon.createMany({
      data: [
        {
          categoryId: laptop.id,
          name: 'Data Recovery',
          description: 'Data recovery service',
          priceType: 'FIXED',
          priceValue: 1000,
          status: 'ACTIVE',
        },
      ],
    });
  }
  console.log('Addons created');

  // Create Pricing Slabs
  if (mobile) {
    await prisma.pricingSlab.createMany({
      data: [
        {
          categoryId: mobile.id,
          minValue: 0,
          maxValue: 30000,
          basePremium: 1500,
          durationMultiplier: JSON.stringify({ '12': 1, '24': 1.8 }),
          gstRate: 18,
          commissionPercent: 10,
          status: 'ACTIVE',
        },
        {
          categoryId: mobile.id,
          minValue: 30001,
          maxValue: 60000,
          basePremium: 2500,
          durationMultiplier: JSON.stringify({ '12': 1, '24': 1.8 }),
          gstRate: 18,
          commissionPercent: 12,
          status: 'ACTIVE',
        },
        {
          categoryId: mobile.id,
          minValue: 60001,
          maxValue: 150000,
          basePremium: 4000,
          durationMultiplier: JSON.stringify({ '12': 1, '24': 1.8 }),
          gstRate: 18,
          commissionPercent: 15,
          status: 'ACTIVE',
        },
      ],
    });
  }

  if (laptop) {
    await prisma.pricingSlab.createMany({
      data: [
        {
          categoryId: laptop.id,
          minValue: 0,
          maxValue: 50000,
          basePremium: 2000,
          durationMultiplier: JSON.stringify({ '12': 1, '24': 1.9, '36': 2.7 }),
          gstRate: 18,
          commissionPercent: 10,
          status: 'ACTIVE',
        },
        {
          categoryId: laptop.id,
          minValue: 50001,
          maxValue: 150000,
          basePremium: 4500,
          durationMultiplier: JSON.stringify({ '12': 1, '24': 1.9, '36': 2.7 }),
          gstRate: 18,
          commissionPercent: 12,
          status: 'ACTIVE',
        },
      ],
    });
  }

  if (car) {
    await prisma.pricingSlab.createMany({
      data: [
        {
          categoryId: car.id,
          minValue: 0,
          maxValue: 500000,
          basePremium: 8000,
          durationMultiplier: JSON.stringify({ '12': 1 }),
          gstRate: 18,
          commissionPercent: 15,
          status: 'ACTIVE',
        },
      ],
    });
  }
  console.log('Pricing slabs created');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });