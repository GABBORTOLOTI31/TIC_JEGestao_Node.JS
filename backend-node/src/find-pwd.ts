const { Client } = require('pg');

const senhas = ['postgres', 'admin', '1234', 'root', 'gabriel', '123456', 'password'];

async function testar() {
  for (const pwd of senhas) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: pwd,
      database: 'ordemservico_db',
    });
    try {
      await client.connect();
      console.log(`✅ Senha encontrada: "${pwd}"`);
      await client.end();
      return;
    } catch (e: any) {
      console.log(`❌ Falha com "${pwd}": ${e.message.split('\n')[0]}`);
    }
  }
  console.log('Nenhuma senha funcionou.');
}

testar();
