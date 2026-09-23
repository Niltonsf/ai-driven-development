import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

type SeedTask = (prisma: PrismaClient) => Promise<void>;

interface UserSeedItem {
  name: string;
  email: string;
  avatarUrl: string;
}

interface AccountSeedItem {
  name: string;
  description?: string;
  type: string;
  accountNumber?: string;
  agency?: string;
  financialInstitution?: string | null;
  color?: string;
  icon?: string;
  isActive: boolean;
}

interface CreditCardSeedItem {
  name: string;
  brand: string;
  lastFourDigits?: string;
  closingDay: number;
  dueDay: number;
  limit?: number;
  color?: string;
  icon?: string;
  isActive: boolean;
}

interface SubcategorySeedItem {
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  order: number;
}

interface CategorySeedItem {
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  subcategories: SubcategorySeedItem[];
}

const SEED_PASSWORD = '#Senha123';

const seedUsers: SeedTask = async (prisma) => {
  const file = join(__dirname, 'data', 'users.json');
  const users = JSON.parse(readFileSync(file, 'utf-8')) as UserSeedItem[];

  const hashed = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const item of users) {
    // Idempotent by email: skip when a user already exists for this email.
    const existing = await prisma.user.findUnique({
      where: { email: item.email },
    });
    if (existing) continue;

    // Shared primary key: password.id === user.id (1:1 relation).
    const id = randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id,
          name: item.name,
          email: item.email,
          avatarUrl: item.avatarUrl,
        },
      });
      await tx.password.create({
        data: { id, value: hashed },
      });
    });
  }

  const total = await prisma.user.count();
  console.log(`Seeded users. Total users in database: ${total}`);
};

const seedAccounts: SeedTask = async (prisma) => {
  const targetUser = await prisma.user.findUnique({ where: { email: 'usuario@formacao.dev' } });
  if (!targetUser) {
    console.log('Seed accounts: user usuario@formacao.dev not found, skipping.');
    return;
  }

  const file = join(__dirname, 'data', 'accounts.json');
  const accounts = JSON.parse(readFileSync(file, 'utf-8')) as AccountSeedItem[];

  for (const item of accounts) {
    const existing = await prisma.account.findFirst({
      where: { name: item.name, userId: targetUser.id, deletedAt: null },
    });
    if (existing) continue;

    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId: targetUser.id,
        name: item.name,
        description: item.description ?? null,
        type: item.type as any,
        accountNumber: item.accountNumber ?? null,
        agency: item.agency ?? null,
        financialInstitution: item.financialInstitution ?? null,
        color: item.color ?? null,
        icon: item.icon ?? null,
        isActive: item.isActive,
      },
    });
  }

  const total = await prisma.account.count({ where: { userId: targetUser.id } });
  console.log(`Seeded accounts for usuario@formacao.dev. Total: ${total}`);
};

const seedCreditCards: SeedTask = async (prisma) => {
  const targetUser = await prisma.user.findUnique({ where: { email: 'usuario@formacao.dev' } });
  if (!targetUser) {
    console.log('Seed credit-cards: user usuario@formacao.dev not found, skipping.');
    return;
  }

  const file = join(__dirname, 'data', 'credit-cards.json');
  const cards = JSON.parse(readFileSync(file, 'utf-8')) as CreditCardSeedItem[];

  for (const item of cards) {
    const existing = await prisma.card.findFirst({
      where: { name: item.name, userId: targetUser.id, deletedAt: null },
    });
    if (existing) continue;

    await prisma.card.create({
      data: {
        id: randomUUID(),
        userId: targetUser.id,
        name: item.name,
        brand: item.brand as any,
        lastFourDigits: item.lastFourDigits ?? null,
        closingDay: item.closingDay,
        dueDay: item.dueDay,
        limit: item.limit ?? null,
        color: item.color ?? null,
        icon: item.icon ?? null,
        isActive: item.isActive,
      },
    });
  }

  const total = await prisma.card.count({ where: { userId: targetUser.id } });
  console.log(`Seeded credit cards for usuario@formacao.dev. Total: ${total}`);
};

const seedCategories: SeedTask = async (prisma) => {
  const targetUser = await prisma.user.findUnique({ where: { email: 'usuario@formacao.dev' } });
  if (!targetUser) {
    console.log('Seed categories: user usuario@formacao.dev not found, skipping.');
    return;
  }

  const file = join(__dirname, 'data', 'categories.json');
  const categories = JSON.parse(readFileSync(file, 'utf-8')) as CategorySeedItem[];

  for (const item of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: item.name, userId: targetUser.id, deletedAt: null },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          id: randomUUID(),
          userId: targetUser.id,
          name: item.name,
          icon: item.icon ?? null,
          color: item.color ?? null,
          isActive: item.isActive,
        },
      });

      for (const subcategory of item.subcategories) {
        await tx.subcategory.create({
          data: {
            id: randomUUID(),
            categoryId: category.id,
            name: subcategory.name,
            icon: subcategory.icon ?? null,
            color: subcategory.color ?? null,
            isActive: subcategory.isActive,
            order: subcategory.order,
          },
        });
      }
    });
  }

  const total = await prisma.category.count({ where: { userId: targetUser.id } });
  console.log(`Seeded categories for usuario@formacao.dev. Total: ${total}`);
};

const seedTasks: SeedTask[] = [seedUsers, seedAccounts, seedCreditCards, seedCategories];

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run prisma/seed/main.ts');
  }

  for (const task of seedTasks) {
    await task(prisma);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
