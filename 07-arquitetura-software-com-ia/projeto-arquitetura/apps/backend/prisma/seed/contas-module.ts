import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import contasData from './data/contas.json';

type ContaSeedItem = {
  name: string;
  description?: string | null;
  agency?: string | null;
  accountNumber?: string | null;
  institutionName?: string | null;
  active?: boolean;
  color?: string | null;
  icon?: string | null;
};

const contas = contasData as ContaSeedItem[];

export async function seedContas(prisma: PrismaClient): Promise<void> {
  for (const conta of contas) {
    await prisma.conta.upsert({
      where: { name: conta.name },
      update: {
        description: conta.description ?? null,
        agency: conta.agency ?? null,
        accountNumber: conta.accountNumber ?? null,
        institutionName: conta.institutionName ?? null,
        active: conta.active ?? true,
        color: conta.color ?? null,
        icon: conta.icon ?? null,
      },
      create: {
        id: randomUUID(),
        name: conta.name,
        description: conta.description ?? null,
        agency: conta.agency ?? null,
        accountNumber: conta.accountNumber ?? null,
        institutionName: conta.institutionName ?? null,
        active: conta.active ?? true,
        color: conta.color ?? null,
        icon: conta.icon ?? null,
      },
    });
  }

  console.log(`Seed: ${contas.length} contas processadas (sem duplicações).`);
}
