/**
 * Demo data for local development. Idempotent: safe to run more than once.
 * All demo accounts use the password below – for local/demo use only.
 */
import { PrismaClient, type RestaurantType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Password123!';

interface DemoRestaurant {
  owner: { fullName: string; email: string };
  restaurant: {
    name: string;
    ownerName: string;
    ownerPhone: string | null;
    street: string;
    city: string;
    location: string | null;
    description: string;
    type: RestaurantType;
    imageUrl: string | null;
  };
  tableGroups: { capacity: number; totalTables: number; occupiedTables: number }[];
}

const demo: DemoRestaurant[] = [
  {
    owner: { fullName: 'דנה לוי', email: 'dana@example.com' },
    restaurant: {
      name: 'פסטה בסטה',
      ownerName: 'דנה לוי',
      ownerPhone: '050-1111111',
      street: 'דיזנגוף 100',
      city: 'תל אביב',
      location: 'מרכז',
      description: 'מסעדה איטלקית חלבית עם פסטה טרייה ופיצות מתנור אבן.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 5, occupiedTables: 3 },
      { capacity: 4, totalTables: 10, occupiedTables: 6 },
    ],
  },
  {
    owner: { fullName: 'יוסי כהן', email: 'yossi@example.com' },
    restaurant: {
      name: 'הגריל של יוסי',
      ownerName: 'יוסי כהן',
      ownerPhone: '052-2222222',
      street: 'שדרות הנשיא 20',
      city: 'חיפה',
      location: 'צפון',
      description: 'סטייקיה ובשרים על האש.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 4, occupiedTables: 4 },
      { capacity: 4, totalTables: 8, occupiedTables: 7 },
      { capacity: 6, totalTables: 2, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'מיכל אברהם', email: 'michal@example.com' },
    restaurant: {
      name: 'קפה הגפן',
      ownerName: 'מיכל אברהם',
      ownerPhone: null,
      street: 'יפו 50',
      city: 'ירושלים',
      location: 'מרכז העיר',
      description: 'בית קפה חלבי עם ארוחות בוקר ומאפים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [{ capacity: 2, totalTables: 12, occupiedTables: 2 }],
  },
  {
    owner: { fullName: 'אבי מזרחי', email: 'avi@example.com' },
    restaurant: {
      name: 'שיפודי הנמל',
      ownerName: 'אבי מזרחי',
      ownerPhone: '054-4444444',
      street: 'הנמל 3',
      city: 'תל אביב',
      location: 'נמל תל אביב',
      description: 'שיפודים, סלטים ואווירה על הים.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 6, occupiedTables: 6 },
      { capacity: 8, totalTables: 1, occupiedTables: 1 },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // A regular user without a restaurant.
  await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: { fullName: 'אורח לדוגמה', email: 'guest@example.com', passwordHash },
  });

  for (const d of demo) {
    const owner = await prisma.user.upsert({
      where: { email: d.owner.email },
      update: {},
      create: { ...d.owner, passwordHash },
    });
    const exists = await prisma.restaurant.findUnique({ where: { ownerId: owner.id } });
    if (exists) continue;
    await prisma.restaurant.create({
      data: { ...d.restaurant, ownerId: owner.id, tableGroups: { create: d.tableGroups } },
    });
  }

  const [users, restaurants] = await Promise.all([prisma.user.count(), prisma.restaurant.count()]);
  console.log(`Seed done: ${users} users, ${restaurants} restaurants. Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
