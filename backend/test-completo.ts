import app from './src/app';
import http from 'http';

const PORT = 3099;
const server = http.createServer(app);

let token = '';
let clienteId = '', tecnicoId = '', servicoId = '', equipamentoId = '';
let materialId = '', agendamentoId = '', osId = '';
let orcamentoId = '', solicitacaoId = '', contatoId = '';

let pass = 0, fail = 0;

async function req(method: string, url: string, body?: any, authToken?: string) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`http://localhost:${PORT}${url}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status !== 204 ? await res.json().catch(() => ({})) : null;
  return { status: res.status, data };
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (e: any) {
    console.error(`❌ ${name}: ${e.message}`);
    fail++;
  }
}

server.listen(PORT, async () => {
  console.log(`\n=== TESTES COMPLETOS DA MIGRAÇÃO ===\n`);

  // ====== AUTH ======
  console.log('--- AUTH ---');
  await test('Registrar usuário ADMIN', async () => {
    const r = await req('POST', '/api/auth/registrar', { nome: 'Admin Teste', email: 'admin@teste.com', senha: 'Admin@123', perfil: 'ADMIN' });
    if (r.status !== 200 || !r.data.id) throw new Error(JSON.stringify(r.data));
  });
  await test('Login com credenciais válidas', async () => {
    const r = await req('POST', '/api/auth/login', { email: 'admin@teste.com', senha: 'Admin@123' });
    if (r.status !== 200 || !r.data.token) throw new Error(JSON.stringify(r.data));
    token = r.data.token;
  });
  await test('Login com senha incorreta retorna 401', async () => {
    const r = await req('POST', '/api/auth/login', { email: 'admin@teste.com', senha: 'senhaerrada' });
    if (r.status !== 401) throw new Error(`Esperado 401, recebeu ${r.status}`);
  });
  await test('Login com usuário inexistente retorna 401', async () => {
    const r = await req('POST', '/api/auth/login', { email: 'naoexiste@x.com', senha: '123' });
    if (r.status !== 401) throw new Error(`Esperado 401, recebeu ${r.status}`);
  });
  await test('Rota protegida sem token retorna 401', async () => {
    const r = await req('GET', '/api/clientes');
    if (r.status !== 401) throw new Error(`Esperado 401, recebeu ${r.status}`);
  });
  await test('Rota protegida com token válido retorna 200', async () => {
    const r = await req('GET', '/api/clientes', undefined, token);
    if (r.status !== 200) throw new Error(`Esperado 200, recebeu ${r.status}`);
  });
  await test('Rota protegida com token inválido retorna 401', async () => {
    const r = await req('GET', '/api/clientes', undefined, 'tokeninvalido');
    if (r.status !== 401) throw new Error(`Esperado 401, recebeu ${r.status}`);
  });

  // ====== CLIENTE ======
  console.log('\n--- CLIENTE ---');
  await test('Criar Cliente', async () => {
    const r = await req('POST', '/api/clientes', {
      nome: 'João Cliente', cpf: '11122233344', telefone: '11999001122',
      email: 'joao@cliente.com', dataCadastro: '2023-01-01', endereco: 'Rua A, 1'
    }, token);
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    clienteId = r.data.id;
  });
  await test('CPF duplicado retorna 400', async () => {
    const r = await req('POST', '/api/clientes', {
      nome: 'Outro', cpf: '11122233344', telefone: '99999999999',
      email: 'outro@email.com', dataCadastro: '2023-01-01', endereco: 'Rua B'
    }, token);
    if (r.status !== 400) throw new Error(`Esperado 400, recebeu ${r.status}`);
  });
  await test('Email duplicado retorna 400', async () => {
    const r = await req('POST', '/api/clientes', {
      nome: 'Outro2', cpf: '99988877766', telefone: '99999999999',
      email: 'joao@cliente.com', dataCadastro: '2023-01-01', endereco: 'Rua C'
    }, token);
    if (r.status !== 400) throw new Error(`Esperado 400, recebeu ${r.status}`);
  });
  await test('Listar Clientes', async () => {
    const r = await req('GET', '/api/clientes', undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Buscar Cliente por ID', async () => {
    const r = await req('GET', `/api/clientes/${clienteId}`, undefined, token);
    if (r.status !== 200 || r.data.id !== clienteId) throw new Error('Falha busca por ID');
  });
  await test('Buscar Cliente por Nome', async () => {
    const r = await req('GET', '/api/clientes/busca?nome=João', undefined, token);
    if (r.status !== 200 || !r.data.length) throw new Error('Falha busca por nome');
  });
  await test('Atualizar Cliente', async () => {
    const r = await req('PUT', `/api/clientes/${clienteId}`, {
      nome: 'João Atualizado', telefone: '11999001122', email: 'joao@cliente.com',
      dataCadastro: '2023-01-01', endereco: 'Rua A, 2'
    }, token);
    if (r.status !== 200 || r.data.nome !== 'João Atualizado') throw new Error('Falha ao atualizar');
  });

  // ====== TECNICO ======
  console.log('\n--- TECNICO ---');
  await test('Criar Tecnico', async () => {
    const r = await req('POST', '/api/tecnicos', {
      nome: 'Pedro Técnico', cpf: '55566677788', telefone: '11888001122',
      email: 'pedro@tecnico.com', especialidade: 'Refrigeração', nrRegistro: 'CREA-001'
    }, token);
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    tecnicoId = r.data.id;
  });
  await test('Registro duplicado retorna 400', async () => {
    const r = await req('POST', '/api/tecnicos', {
      nome: 'Outro Tec', cpf: '44455566677', telefone: '11777001122',
      email: 'outro@tec.com', especialidade: 'X', nrRegistro: 'CREA-001'
    }, token);
    if (r.status !== 400) throw new Error(`Esperado 400, recebeu ${r.status}`);
  });
  await test('Listar Tecnicos', async () => {
    const r = await req('GET', '/api/tecnicos', undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Listar Tecnicos Ativos', async () => {
    const r = await req('GET', '/api/tecnicos/ativos', undefined, token);
    if (r.status !== 200) throw new Error('Falha listar ativos');
  });
  await test('Buscar Tecnico por Nome', async () => {
    const r = await req('GET', '/api/tecnicos/busca?nome=Pedro', undefined, token);
    if (r.status !== 200 || !r.data.length) throw new Error('Falha busca por nome');
  });
  await test('Toggle Ativo/Inativo Tecnico', async () => {
    const r = await req('PATCH', `/api/tecnicos/${tecnicoId}/status`, undefined, token);
    if (r.status !== 200 || r.data.ativo !== false) throw new Error('Falha toggle ativo');
    // Reativar
    await req('PATCH', `/api/tecnicos/${tecnicoId}/status`, undefined, token);
  });

  // ====== SERVICO ======
  console.log('\n--- SERVICO ---');
  await test('Criar Servico', async () => {
    const r = await req('POST', '/api/servicos', {
      nome: 'Manutenção AC', descricao: 'Serviço de manutenção', valorBase: 150.0, duracaoEstimada: 90
    }, token);
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    servicoId = r.data.id;
  });
  await test('Listar Servicos', async () => {
    const r = await req('GET', '/api/servicos', undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Listar Servicos Ativos', async () => {
    const r = await req('GET', '/api/servicos/ativos', undefined, token);
    if (r.status !== 200) throw new Error('Falha listar ativos');
  });
  await test('Buscar Servico por Nome', async () => {
    const r = await req('GET', '/api/servicos/busca?nome=Manutenção', undefined, token);
    if (r.status !== 200 || !r.data.length) throw new Error('Falha busca');
  });
  await test('Toggle Ativo Servico', async () => {
    const r = await req('PATCH', `/api/servicos/${servicoId}/status`, undefined, token);
    if (r.status !== 200 || r.data.ativo !== false) throw new Error('Falha toggle');
    await req('PATCH', `/api/servicos/${servicoId}/status`, undefined, token);
  });

  // ====== EQUIPAMENTO ======
  console.log('\n--- EQUIPAMENTO ---');
  await test('Criar Equipamento', async () => {
    const r = await req('POST', '/api/equipamentos', {
      modelo: 'Split 12000', marca: 'Samsung', numeroSerie: 'SN-001', problemaRelatado: 'Não resfria'
    }, token);
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    equipamentoId = r.data.id;
  });
  await test('Numero serie duplicado retorna 400', async () => {
    const r = await req('POST', '/api/equipamentos', {
      modelo: 'X', marca: 'Y', numeroSerie: 'SN-001', problemaRelatado: 'Z'
    }, token);
    if (r.status !== 400) throw new Error(`Esperado 400, recebeu ${r.status}`);
  });
  await test('Listar Equipamentos', async () => {
    const r = await req('GET', '/api/equipamentos', undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Atualizar Equipamento', async () => {
    const r = await req('PUT', `/api/equipamentos/${equipamentoId}`, {
      modelo: 'Split 18000', marca: 'LG', numeroSerie: 'SN-001', problemaRelatado: 'Barulho'
    }, token);
    if (r.status !== 200 || r.data.modelo !== 'Split 18000') throw new Error('Falha ao atualizar');
  });

  // ====== MATERIAL ======
  console.log('\n--- MATERIAL ---');
  await test('Criar Material', async () => {
    const r = await req('POST', '/api/materiais', {
      descricao: 'Gás R-22', unidade: 'kg', precoUnitario: 80.0
    }, token);
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    materialId = r.data.id;
  });
  await test('Listar Materiais', async () => {
    const r = await req('GET', '/api/materiais', undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Buscar Material por Descricao', async () => {
    const r = await req('GET', '/api/materiais/busca?descricao=Gás', undefined, token);
    if (r.status !== 200 || !r.data.length) throw new Error('Falha busca');
  });

  // ====== AGENDAMENTO ======
  console.log('\n--- AGENDAMENTO ---');
  const futura = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  futura.setHours(10, 0, 0, 0);
  await test('Criar Agendamento', async () => {
    const r = await req('POST', '/api/agendamentos', {
      clienteId, tecnicoId, servicoId,
      dataHoraMarcada: futura.toISOString(),
      observacoes: 'Primeiro agendamento'
    }, token);
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    agendamentoId = r.data.id;
  });
  await test('Conflito de horário retorna 400', async () => {
    const conflito = new Date(futura);
    conflito.setMinutes(30); // 10:30 - dentro do intervalo 10:00-11:30
    const r = await req('POST', '/api/agendamentos', {
      clienteId, tecnicoId, servicoId,
      dataHoraMarcada: conflito.toISOString(),
    }, token);
    if (r.status !== 400) throw new Error(`Esperado 400, recebeu ${r.status}`);
  });
  await test('Listar Agendamentos', async () => {
    const r = await req('GET', '/api/agendamentos', undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Atualizar Status Agendamento para CONFIRMADO', async () => {
    const r = await req('PATCH', `/api/agendamentos/${agendamentoId}/status?status=CONFIRMADO`, undefined, token);
    if (r.status !== 200 || r.data.status !== 'CONFIRMADO') throw new Error('Falha ao atualizar status');
  });

  // ====== ORDEM DE SERVICO ======
  console.log('\n--- ORDEM DE SERVICO ---');
  await test('Criar OS', async () => {
    const r = await req('POST', '/api/ordens-servico', {
      clienteId, tecnicoId, equipamentoId,
      agendamentoId, valorMaoDeObra: 200.0
    }, token);
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    osId = r.data.id;
    if (r.data.status !== 'ABERTA') throw new Error(`Status esperado ABERTA, recebeu ${r.data.status}`);
    if (r.data.valorTotal !== 200.0) throw new Error(`valorTotal esperado 200, recebeu ${r.data.valorTotal}`);
  });
  await test('Listar OS', async () => {
    const r = await req('GET', '/api/ordens-servico', undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Adicionar Material na OS e recalcular valor total', async () => {
    const r = await req('POST', `/api/ordens-servico/${osId}/materiais?idMaterial=${materialId}&quantidade=2`, undefined, token);
    if (r.status !== 200) throw new Error(JSON.stringify(r.data));
    // valorTotal deve ser 200 (mão de obra) + 2 * 80 (material) = 360
    if (r.data.valorTotal !== 360.0) throw new Error(`valorTotal esperado 360, recebeu ${r.data.valorTotal}`);
  });
  await test('Definir Checklist na OS', async () => {
    const r = await req('POST', `/api/ordens-servico/${osId}/checklist`, {
      pressaoOk: true, temperaturaOk: true, limpezaOk: false, vazamentoVerificado: true,
      observacoesGerais: 'Limpeza pendente'
    }, token);
    if (r.status !== 200 || !r.data.checklist) throw new Error('Falha ao definir checklist');
  });
  await test('Atualizar Status OS para EM_ANDAMENTO', async () => {
    const r = await req('PATCH', `/api/ordens-servico/${osId}/status?status=EM_ANDAMENTO`, undefined, token);
    if (r.status !== 200 || r.data.status !== 'EM_ANDAMENTO') throw new Error('Falha ao mudar status');
  });
  await test('Atualizar Status OS para CONCLUIDA define dataConclusao', async () => {
    const r = await req('PATCH', `/api/ordens-servico/${osId}/status?status=CONCLUIDA`, undefined, token);
    if (r.status !== 200 || r.data.status !== 'CONCLUIDA') throw new Error('Falha ao concluir');
    if (!r.data.dataConclusao) throw new Error('dataConclusao não definida');
  });
  await test('Adicionar material em OS CONCLUIDA retorna 400', async () => {
    const r = await req('POST', `/api/ordens-servico/${osId}/materiais?idMaterial=${materialId}&quantidade=1`, undefined, token);
    if (r.status !== 400) throw new Error(`Esperado 400, recebeu ${r.status}`);
  });

  // ====== ORCAMENTO ======
  console.log('\n--- ORCAMENTO ---');
  await test('Criar Orcamento (público)', async () => {
    const r = await req('POST', '/api/orcamentos', {
      nome: 'Ana Souza', telefone: '11777001100', email: 'ana@email.com',
      tipoServico: 'Manutenção', descricao: 'AC da sala'
    });
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    orcamentoId = r.data.id;
  });
  await test('Listar Orcamentos', async () => {
    const r = await req('GET', '/api/orcamentos');
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Atualizar Status Orcamento', async () => {
    const r = await req('PATCH', `/api/orcamentos/${orcamentoId}/status?status=EM_ANALISE`);
    if (r.status !== 200 || r.data.status !== 'EM_ANALISE') throw new Error('Falha ao atualizar status');
  });

  // ====== SOLICITACAO ======
  console.log('\n--- SOLICITACAO DE SERVICO ---');
  await test('Criar Solicitacao (público)', async () => {
    const r = await req('POST', '/api/solicitacoes', {
      nome: 'Carlos Lima', telefone: '11666001100',
      endereco: 'Av. Brasil, 500', tipoServico: 'Instalação', observacoes: 'Urgente'
    });
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    solicitacaoId = r.data.id;
  });
  await test('Listar Solicitacoes', async () => {
    const r = await req('GET', '/api/solicitacoes');
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Listar Solicitacoes por Status', async () => {
    const r = await req('GET', '/api/solicitacoes/status?status=PENDENTE');
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao filtrar por status');
  });

  // ====== CONTATO ======
  console.log('\n--- CONTATO ---');
  await test('Criar Contato (público)', async () => {
    const r = await req('POST', '/api/contatos', {
      nome: 'Maria Fernanda', telefone: '11555001100', mensagem: 'Quero saber sobre serviços'
    });
    if (r.status !== 201 || !r.data.id) throw new Error(JSON.stringify(r.data));
    contatoId = r.data.id;
  });
  await test('Listar Contatos', async () => {
    const r = await req('GET', '/api/contatos');
    if (r.status !== 200 || !Array.isArray(r.data)) throw new Error('Falha ao listar');
  });
  await test('Buscar Contato por ID', async () => {
    const r = await req('GET', `/api/contatos/${contatoId}`);
    if (r.status !== 200) throw new Error('Falha busca por ID');
  });

  // ====== LIMPEZA (CLEANUP) ======
  console.log('\n--- LIMPEZA ---');
  await test('Deletar OS (cascata itens e checklist)', async () => {
    const r = await req('DELETE', `/api/ordens-servico/${osId}`, undefined, token);
    if (r.status !== 204) throw new Error(`Falha ao deletar OS: ${r.status}`);
  });
  await test('Deletar Agendamento', async () => {
    const r = await req('DELETE', `/api/agendamentos/${agendamentoId}`, undefined, token);
    if (r.status !== 204) throw new Error(`Falha: ${r.status}`);
  });
  await test('Deletar Material', async () => {
    const r = await req('DELETE', `/api/materiais/${materialId}`, undefined, token);
    if (r.status !== 204) throw new Error(`Falha: ${r.status}`);
  });
  await test('Deletar Equipamento', async () => {
    const r = await req('DELETE', `/api/equipamentos/${equipamentoId}`, undefined, token);
    if (r.status !== 204) throw new Error(`Falha: ${r.status}`);
  });
  await test('Deletar Servico', async () => {
    const r = await req('DELETE', `/api/servicos/${servicoId}`, undefined, token);
    if (r.status !== 204) throw new Error(`Falha: ${r.status}`);
  });
  await test('Deletar Tecnico', async () => {
    const r = await req('DELETE', `/api/tecnicos/${tecnicoId}`, undefined, token);
    if (r.status !== 204) throw new Error(`Falha: ${r.status}`);
  });
  await test('Deletar Cliente', async () => {
    const r = await req('DELETE', `/api/clientes/${clienteId}`, undefined, token);
    if (r.status !== 204) throw new Error(`Falha: ${r.status}`);
  });
  await test('Deletar Contato', async () => {
    const r = await req('DELETE', `/api/contatos/${contatoId}`);
    if (r.status !== 204) throw new Error(`Falha: ${r.status}`);
  });

  console.log(`\n=== RESULTADO: ${pass} aprovados, ${fail} falhas ===\n`);
  server.close();
  process.exit(fail > 0 ? 1 : 0);
});
