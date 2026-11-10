import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Cliente } from '../types/Cliente';
import type { Tecnico } from '../types/Tecnico';
import type { Equipamento, NovoEquipamento } from '../types/Equipamento';
import type { Agendamento } from '../types/Agendamento';
import type { NovaOrdemServico, OrdemServico } from '../types/OrdemServico';

type OrdemServicoFormProps = {
  onLogout: () => void;
};

/**
 * Componente de Formulário de Nova Ordem de Serviço (Fase 6B-2)
 *
 * Características e Integração com o Backend:
 * 1. Campos principais:
 *    - Cliente: Seleção a partir de GET /api/clientes.
 *    - Técnico: Somente técnicos ativos de GET /api/tecnicos/ativos.
 *    - Equipamento: Seleção a partir de GET /api/equipamentos.
 *      (O backend não associa equipamento a cliente na modelagem, portanto a lista é global).
 *    - Valor de mão de obra: Aceita vírgula ou ponto decimal, converte para número e impede valores negativos.
 *    - Diagnóstico técnico: Campo de texto livre com aviso explícito de imutabilidade.
 * 2. Cadastro Rápido de Equipamento:
 *    - Seção expansível para cadastrar equipamento inline via POST /api/equipamentos.
 *    - Ao salvar, seleciona automaticamente o equipamento recém-criado.
 *    - Caso a criação da OS falhe posteriormente, o equipamento já permanece registrado no banco.
 * 3. Vínculo opcional com Agendamento:
 *    - Após escolher o cliente, filtra em memória os agendamentos dele com status diferente de CANCELADO e CONCLUIDO.
 * 4. Navegação:
 *    - Ao criar com sucesso, redireciona diretamente para a tela de detalhes /ordens-servico/:id gerada.
 */
export function OrdemServicoForm({ onLogout }: OrdemServicoFormProps) {
  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  // Listas de dados carregados do backend
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState<Agendamento[]>([]);

  // Estados dos campos do formulário da OS
  const [clienteId, setClienteId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [equipamentoId, setEquipamentoId] = useState('');
  const [agendamentoId, setAgendamentoId] = useState('');
  const [valorMaoDeObraStr, setValorMaoDeObraStr] = useState('0,00');
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState('');

  // Estados da seção de Cadastro Rápido de Equipamento
  const [exibirCadastroRapido, setExibirCadastroRapido] = useState(false);
  const [novoModelo, setNovoModelo] = useState('');
  const [novoMarca, setNovoMarca] = useState('');
  const [novoNumeroSerie, setNovoNumeroSerie] = useState('');
  const [novoProblemaRelatado, setNovoProblemaRelatado] = useState('');
  const [salvandoEquipamento, setSalvandoEquipamento] = useState(false);
  const [erroEquipamento, setErroEquipamento] = useState<string | null>(null);
  const [sucessoEquipamento, setSucessoEquipamento] = useState<string | null>(null);

  // Estados de controle geral
  const [carregando, setCarregando] = useState(true);
  const [salvandoOS, setSalvandoOS] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Trata respostas 401 (Token ausente ou expirado)
   */
  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  /**
   * Carga inicial dos dados necessários para preencher os selects
   */
  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        // 1. Busca todos os clientes
        const resClientes = await fetch(`${apiHost}/clientes`, { headers });
        if (resClientes.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resClientes.ok) throw new Error('Falha ao carregar lista de clientes.');
        const dadosClientes: Cliente[] = await resClientes.json();
        setClientes(dadosClientes);

        // 2. Busca técnicos ativos
        const resTecnicos = await fetch(`${apiHost}/tecnicos/ativos`, { headers });
        if (resTecnicos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resTecnicos.ok) throw new Error('Falha ao carregar técnicos ativos.');
        const dadosTecnicos: Tecnico[] = await resTecnicos.json();
        setTecnicos(dadosTecnicos);

        // 3. Busca equipamentos cadastrados
        const resEquipamentos = await fetch(`${apiHost}/equipamentos`, { headers });
        if (resEquipamentos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resEquipamentos.ok) throw new Error('Falha ao carregar equipamentos.');
        const dadosEquipamentos: Equipamento[] = await resEquipamentos.json();
        setEquipamentos(dadosEquipamentos);

        // 4. Busca todos os agendamentos para permitir vínculo opcional
        const resAgendamentos = await fetch(`${apiHost}/agendamentos`, { headers });
        if (resAgendamentos.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (resAgendamentos.ok) {
          const dadosAg: Agendamento[] = await resAgendamentos.json();
          setTodosAgendamentos(dadosAg);
        }
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados iniciais do formulário.');
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  /**
   * Filtra os agendamentos do cliente selecionado que estejam em aberto
   * (exclui agendamentos com status CANCELADO ou CONCLUIDO)
   */
  const agendamentosDisponiveis = todosAgendamentos.filter(
    (ag) =>
      ag.cliente?.id === clienteId &&
      ag.status !== 'CANCELADO' &&
      ag.status !== 'CONCLUIDO'
  );

  /**
   * Cadastro Rápido de Equipamento via POST /api/equipamentos
   */
  async function handleCadastrarEquipamento(e: FormEvent) {
    e.preventDefault();
    setErroEquipamento(null);
    setSucessoEquipamento(null);

    if (!novoModelo.trim() || !novoMarca.trim() || !novoNumeroSerie.trim() || !novoProblemaRelatado.trim()) {
      setErroEquipamento('Preencha todos os campos do equipamento.');
      return;
    }

    setSalvandoEquipamento(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const payload: NovoEquipamento = {
      modelo: novoModelo.trim(),
      marca: novoMarca.trim(),
      numeroSerie: novoNumeroSerie.trim(),
      problemaRelatado: novoProblemaRelatado.trim(),
    };

    try {
      const res = await fetch(`${apiHost}/equipamentos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!res.ok) {
        // Exibe erro específico do backend (ex: "Já existe um equipamento com o número de série: ...")
        const dadosErro = await res.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao cadastrar equipamento (Status ${res.status})`);
      }

      const equipamentoCriado: Equipamento = await res.json();

      // Adiciona o novo equipamento na lista em memória e o seleciona no select principal
      setEquipamentos((prev) => [...prev, equipamentoCriado]);
      setEquipamentoId(equipamentoCriado.id);

      // Limpa os campos do cadastro rápido e fecha a seção
      setNovoModelo('');
      setNovoMarca('');
      setNovoNumeroSerie('');
      setNovoProblemaRelatado('');
      setExibirCadastroRapido(false);
      setSucessoEquipamento(`Equipamento "${equipamentoCriado.marca} ${equipamentoCriado.modelo}" cadastrado e selecionado!`);
    } catch (err: any) {
      setErroEquipamento(err.message || 'Falha ao salvar equipamento.');
    } finally {
      setSalvandoEquipamento(false);
    }
  }

  /**
   * Submissão do formulário de criação da Ordem de Serviço
   * Endpoint: POST /api/ordens-servico
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!clienteId) {
      setErro('Por favor, selecione um cliente.');
      return;
    }
    if (!tecnicoId) {
      setErro('Por favor, selecione um técnico responsável.');
      return;
    }
    if (!equipamentoId) {
      setErro('Por favor, selecione o equipamento atendido.');
      return;
    }

    // Conversão do valor de mão de obra (aceita vírgula ou ponto decimal)
    const valorLimpo = valorMaoDeObraStr.replace(/\s/g, '').replace(',', '.');
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico < 0) {
      setErro('O valor de mão de obra deve ser um número válido e não pode ser negativo.');
      return;
    }

    setSalvandoOS(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const payload: NovaOrdemServico = {
      clienteId,
      tecnicoId,
      equipamentoId,
      valorMaoDeObra: valorNumerico,
      diagnosticoTecnico: diagnosticoTecnico.trim() || undefined,
      agendamentoId: agendamentoId || undefined,
    };

    try {
      const res = await fetch(`${apiHost}/ordens-servico`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!res.ok) {
        const dadosErro = await res.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao abrir ordem de serviço (Status ${res.status})`);
      }

      const osCriada: OrdemServico = await res.json();

      // Navega imediatamente para a tela de visualização e checklist da OS gerada
      navigate(`/ordens-servico/${osCriada.id}`);
    } catch (err: any) {
      setErro(err.message || 'Falha ao registrar ordem de serviço.');
    } finally {
      setSalvandoOS(false);
    }
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 960 }}>
      {/* Navegação / Breadcrumb */}
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2"
        >
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para o Dashboard
        </Link>
        <h3 className="fw-bold text-dark mb-1">Nova Ordem de Serviço</h3>
        <p className="text-muted small mb-0">
          Abra uma nova Ordem de Serviço vinculando cliente, técnico e equipamento.
        </p>
      </div>

      {/* Alerta de Erro Geral */}
      {erro && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4" role="alert">
          <span className="material-symbols-outlined fs-5">error</span>
          <small>{erro}</small>
        </div>
      )}

      {/* Alerta de Sucesso no Cadastro de Equipamento */}
      {sucessoEquipamento && (
        <div className="alert alert-success d-flex align-items-center justify-content-between py-2 mb-4" role="alert">
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-outlined fs-5">check_circle</span>
            <small>{sucessoEquipamento}</small>
          </div>
          <button
            type="button"
            className="btn-close btn-close-sm"
            onClick={() => setSucessoEquipamento(null)}
          ></button>
        </div>
      )}

      {carregando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted small">Carregando clientes, técnicos e equipamentos...</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 p-4">
          {/* Alerta Informativo de Regras de Negócio do Backend */}
          <div className="alert alert-warning border d-flex align-items-start gap-2 py-2 mb-4">
            <span className="material-symbols-outlined fs-5 text-warning mt-1">info</span>
            <small className="text-dark">
              <strong>Atenção:</strong> O diagnóstico técnico e o valor inicial de mão de obra não podem ser editados depois de criada a Ordem de Serviço (limitação de endpoints do backend). Revise as informações antes de confirmar.
            </small>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Seção 1: Cliente e Agendamento */}
            <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
              <span className="material-symbols-outlined fs-5">person</span>
              Cliente e Vínculo de Atendimento
            </h6>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold mb-0">Cliente *</label>
                  <Link to="/clientes/novo" className="small text-decoration-none" style={{ fontSize: '0.75rem' }}>
                    + Novo Cliente
                  </Link>
                </div>
                {clientes.length === 0 ? (
                  <div className="alert alert-warning py-2 small mb-0">
                    Nenhum cliente cadastrado. Cadastre um cliente primeiro.
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      setAgendamentoId(''); // Limpa o agendamento ao trocar de cliente
                    }}
                    required
                  >
                    <option value="">Selecione o cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.cpf ? `(CPF: ${c.cpf})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Vincular a Agendamento Existente (Opcional)</label>
                <select
                  className="form-select"
                  value={agendamentoId}
                  onChange={(e) => setAgendamentoId(e.target.value)}
                  disabled={!clienteId || agendamentosDisponiveis.length === 0}
                >
                  <option value="">
                    {!clienteId
                      ? 'Selecione um cliente primeiro'
                      : agendamentosDisponiveis.length === 0
                      ? 'Nenhum agendamento pendente para este cliente'
                      : 'Nenhum vínculo (atendimento avulso)'}
                  </option>
                  {agendamentosDisponiveis.map((ag) => {
                    const dataFormatada = new Date(ag.dataHoraMarcada).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });
                    return (
                      <option key={ag.id} value={ag.id}>
                        Agendamento #{ag.id} — {dataFormatada} ({ag.servico?.nome || 'Serviço'})
                      </option>
                    );
                  })}
                </select>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Ao concluir a OS, o agendamento vinculado será atualizado automaticamente para Concluído.
                </div>
              </div>
            </div>

            {/* Seção 2: Técnico e Equipamento */}
            <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
              <span className="material-symbols-outlined fs-5">build</span>
              Técnico Responsável e Equipamento
            </h6>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
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
                    <option value="">Selecione o técnico responsável...</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} {t.especialidade ? `(${t.especialidade})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold mb-0">Equipamento em Atendimento *</label>
                  <button
                    type="button"
                    onClick={() => setExibirCadastroRapido(!exibirCadastroRapido)}
                    className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                    style={{ fontSize: '0.78rem' }}
                  >
                    {exibirCadastroRapido ? 'Fechar cadastro rápido' : '+ Cadastrar Novo Equipamento'}
                  </button>
                </div>

                {equipamentos.length === 0 && !exibirCadastroRapido ? (
                  <div className="alert alert-warning py-2 small mb-0">
                    Nenhum equipamento cadastrado. Use o botão acima para cadastrar.
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={equipamentoId}
                    onChange={(e) => setEquipamentoId(e.target.value)}
                    required={!exibirCadastroRapido}
                  >
                    <option value="">Selecione o equipamento...</option>
                    {equipamentos.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.marca} — {eq.modelo} (Série: {eq.numeroSerie})
                      </option>
                    ))}
                  </select>
                )}
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Nota: Na modelagem do sistema, o cadastro de equipamentos é global e vinculado ao cliente através da OS.
                </div>
              </div>
            </div>

            {/* Painel Expansível de Cadastro Rápido de Equipamento */}
            {exibirCadastroRapido && (
              <div className="card bg-light border p-3 mb-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                  <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                    <span className="material-symbols-outlined fs-6 text-primary">add_box</span>
                    Cadastro Rápido de Equipamento
                  </span>
                  <button
                    type="button"
                    className="btn-close btn-close-sm"
                    onClick={() => setExibirCadastroRapido(false)}
                  ></button>
                </div>

                {erroEquipamento && (
                  <div className="alert alert-danger py-1 px-2 small mb-2">
                    {erroEquipamento}
                  </div>
                )}

                <div className="row g-2 mb-2">
                  <div className="col-sm-6">
                    <label className="form-label small text-muted mb-0">Marca *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ex: LG, Samsung, Daikin..."
                      value={novoMarca}
                      onChange={(e) => setNovoMarca(e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small text-muted mb-0">Modelo *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ex: Split Inverter 12000 BTUs"
                      value={novoModelo}
                      onChange={(e) => setNovoModelo(e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small text-muted mb-0">Número de Série *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Nº de série único"
                      value={novoNumeroSerie}
                      onChange={(e) => setNovoNumeroSerie(e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small text-muted mb-0">Problema Relatado *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ex: Não resfria, faz barulho..."
                      value={novoProblemaRelatado}
                      onChange={(e) => setNovoProblemaRelatado(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    * Se a abertura da OS falhar depois, o equipamento continuará registrado no banco.
                  </span>
                  <button
                    type="button"
                    onClick={handleCadastrarEquipamento}
                    className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1 shadow-sm"
                    disabled={salvandoEquipamento}
                  >
                    {salvandoEquipamento ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <span className="material-symbols-outlined fs-6">save</span>
                    )}
                    {salvandoEquipamento ? 'Salvando...' : 'Salvar Equipamento'}
                  </button>
                </div>
              </div>
            )}

            {/* Seção 3: Valores e Diagnóstico */}
            <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
              <span className="material-symbols-outlined fs-5">payments</span>
              Valores e Diagnóstico Inicial
            </h6>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Valor da Mão de Obra (R$) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">R$</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="150,00"
                    value={valorMaoDeObraStr}
                    onChange={(e) => setValorMaoDeObraStr(e.target.value)}
                    required
                  />
                </div>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Peças adicionais poderão ser lançadas na tela de detalhes da OS.
                </div>
              </div>

              <div className="col-md-8">
                <label className="form-label small fw-semibold">Diagnóstico Técnico Preliminar</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Relato inicial do técnico sobre o problema encontrado no aparelho..."
                  value={diagnosticoTecnico}
                  onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Link to="/dashboard" className="btn btn-outline-secondary px-4">
                Cancelar
              </Link>
              <button
                type="submit"
                className="btn btn-primary px-4 d-flex align-items-center gap-2 shadow-sm"
                disabled={salvandoOS || clientes.length === 0 || tecnicos.length === 0}
              >
                {salvandoOS ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <span className="material-symbols-outlined fs-5">assignment_add</span>
                )}
                {salvandoOS ? 'Abrindo OS...' : 'Abrir Ordem de Serviço'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

