import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating store expenses category to uppercase...');
  await prisma.$executeRaw`UPDATE store_expenses SET category = UPPER(category) WHERE category IS NOT NULL`;
  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
