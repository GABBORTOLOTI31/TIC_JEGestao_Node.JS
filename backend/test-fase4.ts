import app from './src/app';
import http from 'http';

const port = 3001;
const server = http.createServer(app);

server.listen(port, async () => {
  console.log(`Test server running on port ${port}`);

  const baseURL = `http://localhost:${port}/api`;
  let successCount = 0;
  let failCount = 0;

  async function fetchJson(method: string, url: string, body?: any) {
    const res = await fetch(`${baseURL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = res.status !== 204 ? await res.json() : null;
    return { status: res.status, data };
  }

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      successCount++;
    } catch (e: any) {
      console.error(`❌ ${name}`);
      console.error(e.message);
      failCount++;
    }
  }

  try {
    let clienteId: string;
    let tecnicoId: string;

    // --- TESTES DE CLIENTE ---
    await test('Criar Cliente', async () => {
      const res = await fetchJson('POST', '/clientes', {
        nome: 'Cliente Teste',
        cpf: '11122233344',
        telefone: '11999999999',
        email: 'cliente@teste.com',
        dataCadastro: '2023-01-01',
        endereco: 'Rua Teste, 123'
      });
      if (res.status !== 201) throw new Error(`Falha: ${JSON.stringify(res.data)}`);
      clienteId = res.data.id;
    });

    await test('Listar Clientes', async () => {
      const res = await fetchJson('GET', '/clientes');
      if (res.status !== 200 || !Array.isArray(res.data)) throw new Error('Falha ao listar');
      if (!res.data.find((c: any) => c.id === clienteId)) throw new Error('Cliente criado não encontrado na lista');
    });

    await test('Buscar Cliente por ID', async () => {
      const res = await fetchJson('GET', `/clientes/${clienteId}`);
      if (res.status !== 200 || res.data.id !== clienteId) throw new Error('Falha ao buscar por ID');
    });

    await test('Buscar Cliente por Nome', async () => {
      const res = await fetchJson('GET', `/clientes/busca?nome=Cliente`);
      if (res.status !== 200 || !res.data.length) throw new Error('Falha ao buscar por nome');
    });

    await test('Atualizar Cliente', async () => {
      const res = await fetchJson('PUT', `/clientes/${clienteId}`, {
        nome: 'Cliente Atualizado',
        telefone: '11999999999',
        email: 'cliente.atualizado@teste.com',
        dataCadastro: '2023-01-01',
        endereco: 'Rua Teste, 124'
      });
      if (res.status !== 200 || res.data.nome !== 'Cliente Atualizado') throw new Error('Falha ao atualizar');
    });

    // --- TESTES DE TECNICO ---
    await test('Criar Tecnico', async () => {
      const res = await fetchJson('POST', '/tecnicos', {
        nome: 'Tecnico Teste',
        cpf: '55566677788',
        telefone: '11888888888',
        email: 'tecnico@teste.com',
        especialidade: 'Manutenção',
        nrRegistro: 'CREA123'
      });
      if (res.status !== 201) throw new Error(`Falha: ${JSON.stringify(res.data)}`);
      tecnicoId = res.data.id;
    });

    await test('Listar Tecnicos', async () => {
      const res = await fetchJson('GET', '/tecnicos');
      if (res.status !== 200 || !Array.isArray(res.data)) throw new Error('Falha ao listar');
    });

    await test('Listar Tecnicos Ativos', async () => {
      const res = await fetchJson('GET', '/tecnicos/ativos');
      if (res.status !== 200 || !Array.isArray(res.data)) throw new Error('Falha ao listar ativos');
    });

    await test('Buscar Tecnico por ID', async () => {
      const res = await fetchJson('GET', `/tecnicos/${tecnicoId}`);
      if (res.status !== 200 || res.data.id !== tecnicoId) throw new Error('Falha ao buscar por ID');
    });

    await test('Buscar Tecnico por Nome', async () => {
      const res = await fetchJson('GET', `/tecnicos/busca?nome=Tecnico`);
      if (res.status !== 200 || !res.data.length) throw new Error('Falha ao buscar por nome');
    });

    await test('Atualizar Tecnico', async () => {
      const res = await fetchJson('PUT', `/tecnicos/${tecnicoId}`, {
        nome: 'Tecnico Atualizado',
        telefone: '11888888888',
        email: 'tecnico.atualizado@teste.com',
        especialidade: 'Instalação',
        nrRegistro: 'CREA1234'
      });
      if (res.status !== 200 || res.data.nome !== 'Tecnico Atualizado') throw new Error('Falha ao atualizar');
    });

    await test('Desativar Tecnico', async () => {
      const res = await fetchJson('PATCH', `/tecnicos/${tecnicoId}/status`);
      if (res.status !== 200 || res.data.ativo !== false) throw new Error('Falha ao desativar técnico');
    });

    // --- TESTES DE EXCLUSÃO ---
    await test('Excluir Cliente', async () => {
      const res = await fetchJson('DELETE', `/clientes/${clienteId}`);
      if (res.status !== 204) throw new Error('Falha ao excluir cliente');
    });

    await test('Excluir Tecnico', async () => {
      const res = await fetchJson('DELETE', `/tecnicos/${tecnicoId}`);
      if (res.status !== 204) throw new Error('Falha ao excluir tecnico');
    });

    console.log(`\nResultados: ${successCount} sucesso(s), ${failCount} falha(s)`);

  } catch (e: any) {
    console.error('Erro fatal nos testes:', e);
  } finally {
    server.close();
    process.exit(failCount > 0 ? 1 : 0);
  }
});
