import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router';
import type { Agendamento } from '../types/Agendamento';
import type { OrdemServico, StatusOS } from '../types/OrdemServico';
import type { Cliente } from '../types/Cliente';
import type { Tecnico } from '../types/Tecnico';

type DashboardProps = {
  onLogout: () => void;
};

/**
 * Componente do Dashboard Administrativo
 * Responsável por:
 * 1. Consumir sequencialmente os dados do backend via fetch nativo (estilo PP2):
 *    - GET /api/agendamentos
 *    - GET /api/ordens-servico
 *    - GET /api/clientes
 *    - GET /api/tecnicos/ativos
 * 2. Calcular os KPIs contando e filtrando as listas no frontend.
 * 3. Tratar respostas 401 limpando o token e redirecionando para /login.
 * 4. Exibir lista de próximos agendamentos e tabela de ordens de serviço.
 */
export function Dashboard({ onLogout }: DashboardProps) {
  // --- Estados para os dados carregados do backend ---
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalTecnicosAtivos, setTotalTecnicosAtivos] = useState(0);

  // --- Estados de controle de interface ---
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroApenasAbertas, setFiltroApenasAbertas] = useState(true);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  /**
   * Função auxiliar para tratar expiração ou ausência de autorização (HTTP 401).
   * Limpa o token do localStorage, atualiza o estado do App e redireciona para a tela de login.
   */
  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  /**
   * Função assíncrona que realiza a busca de dados na API.
   * Conforme o padrão do PP2, declarada dentro do useEffect e executada na montagem.
   */
  useEffect(() => {
    async function fetchData() {
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        // ---------------------------------------------------------------------
        // NOTA DIDÁTICA (Estilo PP2):
        // Realizamos as 4 requisições sequencialmente utilizando "await", uma
        // após a outra, para manter o código linear e simples de compreender.
        // Em aplicações avançadas de produção, poderíamos utilizar "Promise.all"
        // para executar as quatro requisições em paralelo (conceito além do visto em aula).
        // ---------------------------------------------------------------------

        // 1. Chamada para listar agendamentos
        const resAgendamentos = await fetch(`${apiHost}/agendamentos`, { headers });
        if (resAgendamentos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resAgendamentos.ok) {
          throw new Error(`Falha ao carregar agendamentos (Status ${resAgendamentos.status})`);
        }
        const dadosAgendamentos: Agendamento[] = await resAgendamentos.json();
        setAgendamentos(dadosAgendamentos);

        // 2. Chamada para listar ordens de serviço
        const resOrdens = await fetch(`${apiHost}/ordens-servico`, { headers });
        if (resOrdens.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resOrdens.ok) {
          throw new Error(`Falha ao carregar ordens de serviço (Status ${resOrdens.status})`);
        }
        const dadosOrdens: OrdemServico[] = await resOrdens.json();
        setOrdens(dadosOrdens);

        // 3. Chamada para listar clientes (para contabilizar o total)
        const resClientes = await fetch(`${apiHost}/clientes`, { headers });
        if (resClientes.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resClientes.ok) {
          throw new Error(`Falha ao carregar clientes (Status ${resClientes.status})`);
        }
        const dadosClientes: Cliente[] = await resClientes.json();
        setTotalClientes(dadosClientes.length);

        // 4. Chamada para listar técnicos ativos
        const resTecnicos = await fetch(`${apiHost}/tecnicos/ativos`, { headers });
        if (resTecnicos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resTecnicos.ok) {
          throw new Error(`Falha ao carregar técnicos ativos (Status ${resTecnicos.status})`);
        }
        const dadosTecnicos: Tecnico[] = await resTecnicos.json();
        setTotalTecnicosAtivos(dadosTecnicos.length);
      } catch (err: any) {
        setErro(err.message || 'Erro inesperado ao carregar dados do servidor.');
      } finally {
        setCarregando(false);
      }
    }

    fetchData();
  }, []); // Vetor de dependências vazio para disparar apenas na montagem do componente

  // ---------------------------------------------------------------------------
  // CÁLCULO DOS KPIS:
  // ---------------------------------------------------------------------------

  // 1. "Agendamentos de Hoje":
  // NOTA DIDÁTICA: O PostgreSQL e o Prisma retornam datas no padrão UTC (ISO 8601, terminando em 'Z').
  // Como o Brasil está no fuso horário UTC-3, comparar strings brutas (como .startsWith('2026-11-04'))
  // provocaria falhas, pois horários após as 21h já pertenceriam ao dia seguinte em UTC.
  // Instanciando com new Date() e usando .getDate(), .getMonth() e .getFullYear(),
  // o JavaScript converte os valores para o fuso horário LOCAL da máquina do operador.
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth();
  const anoHoje = hoje.getFullYear();

  const totalAgendamentosHoje = agendamentos.filter((ag) => {
    const dataAg = new Date(ag.dataHoraMarcada);
    return (
      dataAg.getDate() === diaHoje &&
      dataAg.getMonth() === mesHoje &&
      dataAg.getFullYear() === anoHoje
    );
  }).length;

  // 2. "Ordens em Aberto":
  // Considera apenas status ABERTA, EM_ANDAMENTO ou PAUSADA (exclui CONCLUIDA e CANCELADA)
  const totalOrdensAbertas = ordens.filter(
    (os) => os.status === 'ABERTA' || os.status === 'EM_ANDAMENTO' || os.status === 'PAUSADA'
  ).length;

  // 3. Próximos Agendamentos:
  // Filtra agendamentos futuros ou de hoje (a partir das 00:00 de hoje), descartando os cancelados,
  // ordenados por data crescente e limitados aos 5 primeiros.
  const inicioHoje = new Date(anoHoje, mesHoje, diaHoje);
  const proximosAgendamentos = agendamentos
    .filter((ag) => new Date(ag.dataHoraMarcada) >= inicioHoje && ag.status !== 'CANCELADO')
    .sort((a, b) => new Date(a.dataHoraMarcada).getTime() - new Date(b.dataHoraMarcada).getTime())
    .slice(0, 5);

  // 4. Ordens de serviço para a tabela (com opção de filtrar apenas em aberto)
  const ordensExibidas = filtroApenasAbertas
    ? ordens.filter((os) => os.status === 'ABERTA' || os.status === 'EM_ANDAMENTO' || os.status === 'PAUSADA')
    : ordens;

  /**
   * Função auxiliar para renderizar badges coloridos do Bootstrap de acordo com o Status da OS
   */
  function renderBadgeStatus(status: StatusOS) {
    switch (status) {
      case 'ABERTA':
        return <span className="badge bg-warning text-dark">Aberta</span>;
      case 'EM_ANDAMENTO':
        return <span className="badge bg-primary">Em Andamento</span>;
      case 'PAUSADA':
        return <span className="badge bg-secondary">Pausada</span>;
      case 'CONCLUIDA':
        return <span className="badge bg-success">Concluída</span>;
      case 'CANCELADA':
        return <span className="badge bg-danger">Cancelada</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* Cabeçalho da Página */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Painel Administrativo</h3>
          <p className="text-muted small mb-0">Acompanhamento operacional de agendamentos e ordens de serviço</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <NavLink to="/ordens-servico/nova" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <span className="material-symbols-outlined fs-6">note_add</span>
            Nova Ordem de Serviço
          </NavLink>
          <NavLink to="/agendamentos/novo" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <span className="material-symbols-outlined fs-6">add</span>
            Novo Agendamento
          </NavLink>
          <NavLink to="/clientes" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined fs-6">person_add</span>
            Novo Cliente
          </NavLink>
        </div>
      </div>

      {/* Alerta de Erro na busca de dados */}
      {erro && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between py-2 mb-4" role="alert">
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-outlined fs-5">error</span>
            <small>{erro}</small>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-outline-danger btn-sm py-0 px-2"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Estado de Carregamento (Loading) */}
      {carregando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted small">Carregando indicadores e ordens de serviço...</p>
        </div>
      ) : (
        <>
          {/* Grid de 4 Cards de Indicadores (KPIs) com Bootstrap */}
          <div className="row g-3 mb-4">
            {/* KPI 1: Agendamentos de Hoje */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card shadow-sm border-0 p-3 kpi-card h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                      Agendamentos Hoje
                    </small>
                    <h2 className="fw-bold mt-2 mb-0 text-primary">{totalAgendamentosHoje}</h2>
                  </div>
                  <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                    <span className="material-symbols-outlined fs-4">today</span>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>
                  Fuso horário local (Brasília)
                </small>
              </div>
            </div>

            {/* KPI 2: Ordens em Aberto */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card shadow-sm border-0 p-3 kpi-card h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                      Ordens em Aberto
                    </small>
                    <h2 className="fw-bold mt-2 mb-0 text-warning">{totalOrdensAbertas}</h2>
                  </div>
                  <div className="bg-warning bg-opacity-10 text-warning p-2 rounded-3">
                    <span className="material-symbols-outlined fs-4">assignment</span>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>
                  Abertas, em andamento ou pausadas
                </small>
              </div>
            </div>

            {/* KPI 3: Clientes Cadastrados */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card shadow-sm border-0 p-3 kpi-card h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                      Clientes Cadastrados
                    </small>
                    <h2 className="fw-bold mt-2 mb-0 text-success">{totalClientes}</h2>
                  </div>
                  <div className="bg-success bg-opacity-10 text-success p-2 rounded-3">
                    <span className="material-symbols-outlined fs-4">groups</span>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>
                  Total de clientes ativos
                </small>
              </div>
            </div>

            {/* KPI 4: Técnicos Ativos */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card shadow-sm border-0 p-3 kpi-card h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                      Técnicos Ativos
                    </small>
                    <h2 className="fw-bold mt-2 mb-0 text-info">{totalTecnicosAtivos}</h2>
                  </div>
                  <div className="bg-info bg-opacity-10 text-info p-2 rounded-3">
                    <span className="material-symbols-outlined fs-4">engineering</span>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>
                  Disponíveis para atendimento
                </small>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Bloco 1: Próximos Agendamentos (Limitado a 5) */}
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-primary fs-5">calendar_month</span>
                    Próximos Agendamentos
                  </h5>
                  <NavLink to="/agendamentos/novo" className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }}>
                    Agendar
                  </NavLink>
                </div>

                {proximosAgendamentos.length === 0 ? (
                  <div className="text-center text-muted py-4 small">
                    Nenhum agendamento futuro encontrado.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {proximosAgendamentos.map((ag) => {
                      const dataFormatada = new Date(ag.dataHoraMarcada).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div key={ag.id} className="p-2 border rounded bg-light d-flex justify-content-between align-items-center">
                          <div>
                            <strong className="d-block text-dark small">{ag.cliente?.nome || 'Cliente não identificado'}</strong>
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                              {ag.servico?.nome || 'Serviço técnico'} • Técnico: {ag.tecnico?.nome || 'A definir'}
                            </small>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-light text-primary border small d-block mb-1">
                              {dataFormatada}
                            </span>
                            <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                              {ag.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Resumo Operacional */}
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-primary fs-5">analytics</span>
                    Resumo do Sistema
                  </h5>
                  <span className="badge bg-light text-muted border">Atualizado</span>
                </div>

                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light text-center">
                      <span className="text-muted small d-block mb-1">Total de Ordens Registradas</span>
                      <h4 className="fw-bold text-dark mb-0">{ordens.length}</h4>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light text-center">
                      <span className="text-muted small d-block mb-1">Total de Agendamentos</span>
                      <h4 className="fw-bold text-dark mb-0">{agendamentos.length}</h4>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light text-center">
                      <span className="text-muted small d-block mb-1">Ordens Concluídas</span>
                      <h4 className="fw-bold text-success mb-0">
                        {ordens.filter((o) => o.status === 'CONCLUIDA').length}
                      </h4>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light text-center">
                      <span className="text-muted small d-block mb-1">Ordens Canceladas</span>
                      <h4 className="fw-bold text-danger mb-0">
                        {ordens.filter((o) => o.status === 'CANCELADA').length}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Ordens de Serviço */}
          <div className="card shadow-sm border-0 p-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold text-dark mb-0">Ordens de Serviço</h5>
                <small className="text-muted">
                  {filtroApenasAbertas ? 'Exibindo apenas ordens em aberto' : 'Exibindo todas as ordens registradas'}
                </small>
              </div>

              {/* Ações e Botões de Filtro */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${filtroApenasAbertas ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFiltroApenasAbertas(true)}
                  >
                    Apenas em Aberto ({totalOrdensAbertas})
                  </button>
                  <button
                    type="button"
                    className={`btn ${!filtroApenasAbertas ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFiltroApenasAbertas(false)}
                  >
                    Todas ({ordens.length})
                  </button>
                </div>
                <NavLink to="/ordens-servico/nova" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                  <span className="material-symbols-outlined fs-6">add</span>
                  Nova OS
                </NavLink>
              </div>
            </div>

            {/* Tabela com Bootstrap 5 */}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th>Nº OS</th>
                    <th>Cliente</th>
                    <th>Equipamento / Defeito</th>
                    <th>Técnico</th>
                    <th>Status</th>
                    <th>Data Abertura</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ordensExibidas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4 small">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    ordensExibidas.map((os) => {
                      const dataAberturaFormatada = new Date(os.dataAbertura).toLocaleDateString('pt-BR');
                      return (
                        <tr key={os.id}>
                          <td className="fw-bold text-primary">#{os.id}</td>
                          <td className="text-dark fw-semibold">{os.cliente?.nome || 'Cliente não informado'}</td>
                          <td>
                            <small className="text-dark d-block">
                              {os.equipamento?.modelo || os.diagnosticoTecnico || 'Serviço em climatização'}
                            </small>
                            {os.equipamento?.problemaRelatado && (
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                Defeito: {os.equipamento.problemaRelatado}
                              </small>
                            )}
                          </td>
                          <td className="text-muted small">{os.tecnico?.nome || 'A definir'}</td>
                          <td>{renderBadgeStatus(os.status)}</td>
                          <td className="text-muted small">{dataAberturaFormatada}</td>
                          <td className="text-end">
                            <Link
                              to={`/ordens-servico/${os.id}`}
                              className="btn btn-outline-primary btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                            >
                              <span className="material-symbols-outlined fs-6">visibility</span>
                              Detalhes
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
