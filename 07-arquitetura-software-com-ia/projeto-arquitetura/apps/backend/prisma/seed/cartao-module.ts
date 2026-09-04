import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import cartaoData from './data/cartao.json';

type CartaoSeedItem = {
  name: string;
  description?: string | null;
  brand?: string | null;
  lastDigits?: string | null;
  limit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  active?: boolean;
  color?: string | null;
  icon?: string | null;
};

const cartoes = cartaoData as CartaoSeedItem[];

export async function seedCartao(prisma: PrismaClient): Promise<void> {
  for (const cartao of cartoes) {
    await prisma.cartao.upsert({
      where: { name: cartao.name },
      update: {
        description: cartao.description ?? null,
        brand: cartao.brand ?? null,
        lastDigits: cartao.lastDigits ?? null,
        limit: cartao.limit ?? null,
        closingDay: cartao.closingDay ?? null,
        dueDay: cartao.dueDay ?? null,
        active: cartao.active ?? true,
        color: cartao.color ?? null,
        icon: cartao.icon ?? null,
      },
      create: {
        id: randomUUID(),
        name: cartao.name,
        description: cartao.description ?? null,
        brand: cartao.brand ?? null,
        lastDigits: cartao.lastDigits ?? null,
        limit: cartao.limit ?? null,
        closingDay: cartao.closingDay ?? null,
        dueDay: cartao.dueDay ?? null,
        active: cartao.active ?? true,
        color: cartao.color ?? null,
        icon: cartao.icon ?? null,
      },
    });
  }

  console.log(`Seed: ${cartoes.length} cartões processados (sem duplicações).`);
}
