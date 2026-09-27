import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIndexes() {
  const indexes: any[] = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename IN ('pessoas', 'tecnicos') AND indexname LIKE '%_key%';
  `;
  console.log(indexes);
  await prisma.$disconnect();
}

checkIndexes();
