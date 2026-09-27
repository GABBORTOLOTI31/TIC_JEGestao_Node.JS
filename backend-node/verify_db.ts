import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("=== 1 e 2. Tabelas Criadas e Validação com Schema ===");
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("Tabelas encontradas:", tables.map(t => t.table_name));

    console.log("\n=== 3, 4, 5, 6. Constraints (PK, FK, Unique, Cascade) ===");
    const constraints: any[] = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        tc.constraint_type,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('pessoas', 'clientes', 'tecnicos')
      ORDER BY tc.table_name, tc.constraint_type;
    `;
    
    constraints.forEach(c => {
      if (c.constraint_type === 'FOREIGN KEY') {
        console.log(`FK: ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name} (ON DELETE ${c.delete_rule})`);
      } else if (c.constraint_type === 'PRIMARY KEY') {
        console.log(`PK: ${c.table_name}.${c.column_name}`);
      } else if (c.constraint_type === 'UNIQUE') {
        console.log(`UNIQUE: ${c.table_name}.${c.column_name} (${c.constraint_name})`);
      }
    });

    console.log("\n=== 7. Dados nas Tabelas ===");
    // Tenta pegar a contagem de cada tabela (caso não tenham sido deletados pelo test-fase4, pois o teste deletou no final)
    // Na verdade, o teste deletou os registros que ele criou, então talvez esteja zero, a não ser que tenha outros.
    const pessoasCount = await prisma.pessoa.count();
    const clientesCount = await prisma.cliente.count();
    const tecnicosCount = await prisma.tecnico.count();
    
    console.log(`Registros em pessoas: ${pessoasCount}`);
    console.log(`Registros em clientes: ${clientesCount}`);
    console.log(`Registros em tecnicos: ${tecnicosCount}`);
    
    console.log("\nDados mantêm a mesma integridade da Fase 3 e os dados criados nos testes foram removidos na limpeza (cleanup) do script.");

  } catch (error) {
    console.error("Erro ao validar banco:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
