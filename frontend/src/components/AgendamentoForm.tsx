import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import type { Agendamento, NovoAgendamento, StatusAgendamento } from '../types/Agendamento';
import type { Cliente } from '../types/Cliente';
import type { Tecnico } from '../types/Tecnico';
import type { Servico } from '../types/Servico';

type AgendamentoFormProps = {
  onLogout: () => void;
};

/**
 * Retorna a data atual no formato YYYY-MM-DD considerando o fuso horário local.
 * Essencial para o atributo 'min' do input type="date" e para o valor inicial selecionado.
 */
function obterDataHojeLocal(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Retorna a badge de cor do Bootstrap para o status do agendamento
 */
function obterBadgeStatus(status: StatusAgendamento) {
  switch (status) {
    case 'PENDENTE':
      return 'bg-warning text-dark';
    case 'CONFIRMADO':
      return 'bg-primary text-white';
    case 'CONCLUIDO':
      return 'bg-success text-white';
    case 'CANCELADO':
      return 'bg-secondary text-white';
    default:
      return 'bg-light text-dark';
  }
}

/**
 * Componente de Formulário de Novo Agendamento (Fase 5)
 *
 * Características e Boas Práticas:
 * 1. Validação de conflito de horário no backend (AgendamentoService):
 *    - O backend verifica agendamentos do mesmo técnico no dia selecionado.
 *    - Ignora cancelados e concluídos.
 *    - Considera a duração estimada do serviço em minutos para detectar sobreposição de intervalo.
 *    - Caso haja conflito, devolve a mensagem exata:
 *      "Conflito de horário! O técnico já possui um agendamento das HH:MM às HH:MM."
 * 2. Conversão segura de datas UTC vs Local:
 *    - O usuário informa data e hora no horário local da sua máquina.
 *    - Montamos 'new Date(`${data}T${hora}:00`)' e enviamos via '.toISOString()' (UTC para o PostgreSQL).
 *    - Na exibição no painel lateral, convertemos com 'toLocaleTimeString' no fuso local.
 * 3. Painel lateral com filtragem puramente em memória (sem requisição extra ao mudar a data).
 */
export function AgendamentoForm({ onLogout }: AgendamentoFormProps) {
  const dataHoje = obterDataHojeLocal();

  // Estados dos campos do formulário
  const [clienteId, setClienteId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(dataHoje);
  const [horaSelecionada, setHoraSelecionada] = useState('08:00');
  const [observacoes, setObservacoes] = useState('');

  // Estados dos dados carregados do backend
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  // Estados de controle e feedback
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  /**
   * Trata respostas HTTP 401 (Token ausente ou expirado)
   */
  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  /**
   * Efeito executado na montagem do componente.
   * Realiza 4 chamadas sequenciais com async/await e try/catch (padrão PP2):
   * 1. GET /api/agendamentos - para alimentar o painel lateral de disponibilidade
   * 2. GET /api/clientes - lista de clientes cadastrados
   * 3. GET /api/tecnicos/ativos - somente técnicos ativos
   * 4. GET /api/servicos/ativos - somente serviços ativos
   */
  useEffect(() => {
    async function carregarDadosIniciais() {
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        // 1. Busca todos os agendamentos existentes
        const respAgendamentos = await fetch(`${apiHost}/agendamentos`, { headers });
        if (respAgendamentos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!respAgendamentos.ok) throw new Error('Falha ao carregar agendamentos.');
        const dadosAgendamentos: Agendamento[] = await respAgendamentos.json();
        setAgendamentos(dadosAgendamentos);

        // 2. Busca todos os clientes
        const respClientes = await fetch(`${apiHost}/clientes`, { headers });
        if (respClientes.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!respClientes.ok) throw new Error('Falha ao carregar lista de clientes.');
        const dadosClientes: Cliente[] = await respClientes.json();
        setClientes(dadosClientes);

        // 3. Busca técnicos ativos
        const respTecnicos = await fetch(`${apiHost}/tecnicos/ativos`, { headers });
        if (respTecnicos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!respTecnicos.ok) throw new Error('Falha ao carregar técnicos ativos.');
        const dadosTecnicos: Tecnico[] = await respTecnicos.json();
        setTecnicos(dadosTecnicos);

        // 4. Busca serviços ativos
        const respServicos = await fetch(`${apiHost}/servicos/ativos`, { headers });
        if (respServicos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!respServicos.ok) throw new Error('Falha ao carregar serviços ativos.');
        const dadosServicos: Servico[] = await respServicos.json();
        setServicos(dadosServicos);

      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados necessários para o agendamento.');
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosIniciais();
  }, []);

  /**
   * Filtragem puramente em memória dos agendamentos para a data selecionada.
   *
   * Motivo da comparação ano/mês/dia:
   * A data retornada pelo banco vem em formato ISO (UTC). Ao criar o objeto Date(dataHoraMarcada),
   * os métodos getFullYear(), getMonth() e getDate() retornam os valores no fuso horário LOCAL do
   * navegador (ex: UTC-3 Brasil). Comparando esses valores com o ano, mês e dia da data selecionada
   * no input, evitamos qualquer erro de deslocamento de dia que ocorreria se comparássemos strings UTC puras.
   * Agendamentos CANCELADOS são desconsiderados conforme regra do AgendamentoService.
   */
  const agendamentosDoDia = agendamentos
    .filter((ag) => {
      if (ag.status === 'CANCELADO') return false;
      if (!dataSelecionada) return false;
      const partes = dataSelecionada.split('-').map(Number);
      const [anoSel, mesSel, diaSel] = partes;
      const dataItem = new Date(ag.dataHoraMarcada);
      return (
        dataItem.getFullYear() === anoSel &&
        dataItem.getMonth() + 1 === mesSel &&
        dataItem.getDate() === diaSel
      );
    })
    .sort((a, b) => new Date(a.dataHoraMarcada).getTime() - new Date(b.dataHoraMarcada).getTime());

  /**
   * Submissão do formulário de agendamento (POST /api/agendamentos)
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!clienteId || !servicoId || !tecnicoId || !dataSelecionada || !horaSelecionada) {
      setErro('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    /**
     * Construção da data/hora:
     * 1. Criamos a data no horário local: new Date(`${dataSelecionada}T${horaSelecionada}:00`)
     * 2. Convertemos com toISOString() para enviar em UTC padrão ISO 8601 (ex: "2026-11-07T11:00:00.000Z")
     *    Isso garante que o backend Node/Prisma grave o instante exato no banco de dados.
     */
    const dataHoraLocal = new Date(`${dataSelecionada}T${horaSelecionada}:00`);
    if (isNaN(dataHoraLocal.getTime())) {
      setErro('Data ou horário selecionado inválido.');
      return;
    }

    const payload: NovoAgendamento = {
      clienteId,
      tecnicoId,
      servicoId,
      dataHoraMarcada: dataHoraLocal.toISOString(),
      observacoes: observacoes.trim() || undefined,
    };

    setSalvando(true);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${apiHost}/agendamentos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        // Captura a mensagem de erro exata do backend (ex: conflito de horário do técnico)
        const dadosErro = await response.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao registrar agendamento (Status ${response.status})`);
      }

      // Redireciona com sucesso para o Dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar agendamento.');
    } finally {
      setSalvando(false);
    }
  }

  // Formatação amigável da data selecionada para exibição no cabeçalho do painel lateral
  function formatarDataCabecalho(dataStr: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-').map(Number);
    if (partes.length !== 3) return dataStr;
    const [ano, mes, dia] = partes;
    const dataObj = new Date(ano, mes - 1, dia);
    return dataObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 1200 }}>
      {/* Navegação e Cabeçalho */}
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2"
        >
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para o Dashboard
        </Link>
        <h3 className="fw-bold text-dark mb-1">Novo Agendamento</h3>
        <p className="text-muted small mb-0">
          Selecione o cliente, serviço, data/hora e o técnico disponível para registrar o serviço.
        </p>
      </div>

      {/* Alerta de Erro Geral ou Conflito de Horário */}
      {erro && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-3 mb-4 shadow-sm" role="alert">
          <span className="material-symbols-outlined fs-4">error</span>
          <div>
            <div className="fw-bold">Não foi possível confirmar o agendamento</div>
            <small>{erro}</small>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted small">Carregando técnicos, serviços e horários disponíveis...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Coluna da Esquerda: Formulário de Agendamento */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h5 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <span className="material-symbols-outlined fs-5">calendar_month</span>
                Dados do Agendamento
              </h5>

              <form onSubmit={handleSubmit}>
                {/* 1. Seleção do Cliente */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Cliente *</label>
                    <Link to="/clientes/novo" className="small text-decoration-none" style={{ fontSize: '0.8rem' }}>
                      + Cadastrar Novo Cliente
                    </Link>
                  </div>
                  <select
                    className="form-select"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um cliente cadastrado...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.cpf ? `(CPF: ${c.cpf})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Seleção do Serviço */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Serviço a Executar *</label>
                  {servicos.length === 0 ? (
                    <div className="alert alert-warning py-2 small mb-0">
                      Nenhum serviço ativo encontrado no momento. Cadastre ou ative serviços no sistema.
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={servicoId}
                      onChange={(e) => setServicoId(e.target.value)}
                      required
                    >
                      <option value="">Selecione um serviço...</option>
                      {servicos.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} — Duração estimada: {s.duracaoEstimada || 60} min — R${' '}
                          {Number(s.valorBase).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 3. Data e Horário */}
                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <label className="form-label small fw-semibold">Data do Atendimento *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dataSelecionada}
                      min={dataHoje}
                      onChange={(e) => setDataSelecionada(e.target.value)}
                      required
                    />
                    <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                      Ao alterar a data, a agenda ao lado se atualiza automaticamente.
                    </div>
                  </div>

                  <div className="col-md-5">
                    <label className="form-label small fw-semibold">Horário Inicial *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={horaSelecionada}
                      onChange={(e) => setHoraSelecionada(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 4. Seleção do Técnico */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Técnico Responsável *</label>
                  {tecnicos.length === 0 ? (
                    <div className="alert alert-warning py-2 small mb-0">
                      Nenhum técnico ativo disponível no momento.
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={tecnicoId}
                      onChange={(e) => setTecnicoId(e.target.value)}
                      required
                    >
                      <option value="">Selecione o técnico para o atendimento...</option>
                      {tecnicos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome} {t.especialidade ? `(${t.especialidade})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                    O sistema valida se o técnico já tem outro compromisso no intervalo deste serviço.
                  </div>
                </div>

                {/* 5. Observações */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold">Observações / Detalhes do Local</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Instruções adicionais, ponto de referência, modelo do ar-condicionado..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>

                {/* Botões de Ação */}
                <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                  <Link to="/dashboard" className="btn btn-outline-secondary px-4">
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-flex align-items-center gap-2 shadow-sm"
                    disabled={salvando || tecnicos.length === 0 || servicos.length === 0}
                  >
                    {salvando ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <span className="material-symbols-outlined fs-5">event_available</span>
                    )}
                    {salvando ? 'Agendando...' : 'Confirmar Agendamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Coluna da Direita: Painel de Disponibilidade do Dia */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 p-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-3 pb-2 border-bottom">
                <div>
                  <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-primary fs-5">schedule</span>
                    Agenda do Dia
                  </h6>
                  <small className="text-muted text-capitalize">
                    {formatarDataCabecalho(dataSelecionada)}
                  </small>
                </div>
                <span className="badge bg-light text-primary border">
                  {agendamentosDoDia.length} agendamento(s)
                </span>
              </div>

              {/* Informação contextual */}
              <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>
                Confira abaixo os agendamentos já marcados nesta data para verificar a ocupação dos técnicos.
              </p>

              {agendamentosDoDia.length === 0 ? (
                <div className="text-center py-5 border rounded bg-light-subtle my-auto">
                  <span className="material-symbols-outlined text-muted fs-1 mb-2">event_available</span>
                  <div className="fw-semibold text-dark small">Nenhum agendamento para esta data</div>
                  <small className="text-muted">
                    Todos os técnicos e horários estão livres para marcação neste dia.
                  </small>
                </div>
              ) : (
                <div className="overflow-auto pe-1" style={{ maxHeight: 480 }}>
                  <div className="d-flex flex-column gap-2">
                    {agendamentosDoDia.map((item) => {
                      // Converte a dataHoraMarcada para exibição no fuso horário local
                      const dataObj = new Date(item.dataHoraMarcada);
                      const horarioLocal = dataObj.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const isMesmoTecnico = tecnicoId && item.tecnico?.id === tecnicoId;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded border ${
                            isMesmoTecnico ? 'border-primary bg-primary-subtle' : 'bg-white'
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold text-primary d-inline-flex align-items-center gap-1">
                              <span className="material-symbols-outlined fs-6">alarm</span>
                              {horarioLocal}
                            </span>
                            <span className={`badge ${obterBadgeStatus(item.status)}`} style={{ fontSize: '0.7rem' }}>
                              {item.status}
                            </span>
                          </div>

                          <div className="small fw-semibold text-dark mb-1">
                            {item.cliente?.nome || 'Cliente não identificado'}
                          </div>

                          <div className="text-muted small d-flex flex-column gap-1" style={{ fontSize: '0.78rem' }}>
                            <div className="d-flex align-items-center gap-1">
                              <span className="material-symbols-outlined fs-6 text-secondary">build</span>
                              <span>
                                {item.servico?.nome || 'Serviço'}
                                {item.servico?.duracaoEstimada ? ` (${item.servico.duracaoEstimada} min)` : ''}
                              </span>
                            </div>

                            <div className="d-flex align-items-center gap-1">
                              <span className="material-symbols-outlined fs-6 text-secondary">person</span>
                              <span className={isMesmoTecnico ? 'fw-bold text-primary' : ''}>
                                Técnico: {item.tecnico?.nome || 'Não definido'}
                                {isMesmoTecnico && ' (Selecionado no formulário)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

