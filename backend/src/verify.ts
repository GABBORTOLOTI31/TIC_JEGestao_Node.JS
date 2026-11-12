import { PrismaClient } from '@prisma/client';
import app from './app';

const prisma = new PrismaClient();

async function main() {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log("Conexão com PostgreSQL bem-sucedida!");
    
    // Test BigInt serialization
    const testBigInt = BigInt(9007199254740991);
    const jsonStr = JSON.stringify({ id: testBigInt });
    if (jsonStr === '{"id":"9007199254740991"}') {
      console.log("Serialização do BigInt bem-sucedida!");
    } else {
      console.log("Falha na serialização do BigInt:", jsonStr);
    }
  } catch (error) {
    console.error("Erro na validação:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
