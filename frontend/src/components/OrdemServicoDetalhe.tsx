import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import type { OrdemServico, StatusOS } from '../types/OrdemServico';
import type { Material } from '../types/Material';

type OrdemServicoDetalheProps = {
  onLogout: () => void;
};

/**
 * Retorna a badge de status formatada do Bootstrap com cores representativas
 */
function renderBadgeStatus(status?: StatusOS) {
  if (!status) return null;
  switch (status) {
    case 'ABERTA':
      return <span className="badge bg-warning text-dark px-3 py-2 fs-6">Aberta</span>;
    case 'EM_ANDAMENTO':
      return <span className="badge bg-primary text-white px-3 py-2 fs-6">Em Andamento</span>;
    case 'PAUSADA':
      return <span className="badge bg-secondary text-white px-3 py-2 fs-6">Pausada</span>;
    case 'CONCLUIDA':
      return <span className="badge bg-success text-white px-3 py-2 fs-6">Concluída</span>;
    case 'CANCELADA':
      return <span className="badge bg-danger text-white px-3 py-2 fs-6">Cancelada</span>;
    default:
      return <span className="badge bg-light text-dark px-3 py-2 fs-6">{status}</span>;
  }
}

/**
 * Componente de Visualização e Gestão Completa da Ordem de Serviço (Fase 6B-1)
 *
 * Características e Integração com o Backend Node.js:
 * 1. Mudança de Status:
 *    - Enviada via PATCH /api/ordens-servico/:id/status?status=... (usando query string e encodeURIComponent).
 *    - O backend não valida a máquina de estados, portanto o front-end controla as transições válidas.
 *    - Ao concluir uma OS que tenha agendamento vinculado, faz em seguida PATCH /api/agendamentos/:id/status?status=CONCLUIDO.
 * 2. Checklist Técnico:
 *    - O backend executa um upsert em POST /api/ordens-servico/:id/checklist.
 *    - Enviamos SEMPRE os 5 campos (pressaoOk, temperaturaOk, limpezaOk, vazamentoVerificado e observacoesGerais).
 *    - Se a OS ainda não tiver checklist (retorna null no mapOS), os checkboxes iniciam desmarcados (false).
 * 3. Gestão de Materiais:
 *    - Enviada via POST /api/ordens-servico/:id/materiais?idMaterial=...&quantidade=... (query string).
 *    - O preço unitário é copiado no backend do cadastro do Material. O front NÃO envia preço.
 *    - O backend recalcula e atualiza o valorTotal automaticamente.
 *    - Não há endpoint para remover peças, logo uma confirmação explícita é solicitada.
 * 4. Diagnóstico Técnico e Mão de Obra:
 *    - O backend não disponibiliza endpoint de edição geral da OS (PUT /ordens-servico/:id não existe).
 *      Portanto, são exibidos somente leitura com aviso informativo.
 */
export function OrdemServicoDetalhe({ onLogout }: OrdemServicoDetalheProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  // Estado principal da Ordem de Serviço
  const [os, setOs] = useState<OrdemServico | null>(null);

  // Catálogo de materiais disponíveis para uso
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState<Material[]>([]);

  // Estados dos 5 campos do Checklist Técnico
  // (Caso mapOS devolva null quando a OS ainda não tem checklist, iniciam como false e string vazia)
  const [pressaoOk, setPressaoOk] = useState(false);
  const [temperaturaOk, setTemperaturaOk] = useState(false);
  const [limpezaOk, setLimpezaOk] = useState(false);
  const [vazamentoVerificado, setVazamentoVerificado] = useState(false);
  const [observacoesGerais, setObservacoesGerais] = useState('');

  // Estados para adição de material
  const [materialSelecionadoId, setMaterialSelecionadoId] = useState('');
  const [quantidadeMaterial, setQuantidadeMaterial] = useState<number>(1);
  const [salvandoMaterial, setSalvandoMaterial] = useState(false);

  // Estados de controle e feedback
  const [carregando, setCarregando] = useState(true);
  const [salvandoChecklist, setSalvandoChecklist] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [avisoAgendamento, setAvisoAgendamento] = useState<string | null>(null);

  /**
   * Trata respostas 401 (Token expirado ou inválido)
   */
  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  /**
   * Sincroniza os estados do checklist local a partir dos dados retornados da OS
   */
  function sincronizarChecklist(checklistData: OrdemServico['checklist']) {
    if (checklistData) {
      setPressaoOk(Boolean(checklistData.pressaoOk));
      setTemperaturaOk(Boolean(checklistData.temperaturaOk));
      setLimpezaOk(Boolean(checklistData.limpezaOk));
      setVazamentoVerificado(Boolean(checklistData.vazamentoVerificado));
      setObservacoesGerais(checklistData.observacoesGerais || '');
    } else {
      // Quando a OS ainda NÃO possui checklist, o backend devolve null.
      // Nesse caso, inicializamos todos os checkboxes desmarcados.
      setPressaoOk(false);
      setTemperaturaOk(false);
      setLimpezaOk(false);
      setVazamentoVerificado(false);
      setObservacoesGerais('');
    }
  }

  /**
   * Carrega os dados da OS e a lista de materiais em chamadas sequenciais com async/await (estilo PP2)
   */
  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        // 1. Busca os dados da Ordem de Serviço
        const resOS = await fetch(`${apiHost}/ordens-servico/${id}`, { headers });
        if (resOS.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (!resOS.ok) {
          throw new Error(`Ordem de serviço #${id} não encontrada (Status ${resOS.status})`);
        }
        const dadosOS: OrdemServico = await resOS.json();
        setOs(dadosOS);
        sincronizarChecklist(dadosOS.checklist);

        // 2. Busca catálogo de materiais para a adição de peças
        const resMateriais = await fetch(`${apiHost}/materiais`, { headers });
        if (resMateriais.status === 401) {
          tratarNaoAutorizado();
          return;
        }
        if (resMateriais.ok) {
          const dadosMateriais: Material[] = await resMateriais.json();
          setMateriaisDisponiveis(dadosMateriais);
        }
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar detalhes da ordem de serviço.');
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [id]);

  /**
   * Atualização de status da OS:
   * Endpoint: PATCH /api/ordens-servico/:id/status?status=...
   * Note: O backend lê 'req.query.status'. Não é enviado corpo JSON.
   * Usamos encodeURIComponent no parâmetro de URL por segurança e robustez.
   */
  async function handleMudarStatus(novoStatus: StatusOS) {
    if (!os || !id) return;
    setErro(null);
    setMensagemSucesso(null);
    setAvisoAgendamento(null);

    // Confirmação explícita antes de status irreversíveis
    if (novoStatus === 'CONCLUIDA') {
      const confirmou = window.confirm(
        'Deseja realmente marcar esta Ordem de Serviço como CONCLUÍDA?\n\n' +
        'Esta ação registrará a data de conclusão atual e não permitirá adicionar novos materiais.'
      );
      if (!confirmou) return;
    } else if (novoStatus === 'CANCELADA') {
      const confirmou = window.confirm(
        'Deseja realmente CANCELAR esta Ordem de Serviço?\n\n' +
        'Esta ação cancela o atendimento desta OS.'
      );
      if (!confirmou) return;
    }

    setAtualizandoStatus(true);
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const url = `${apiHost}/ordens-servico/${id}/status?status=${encodeURIComponent(novoStatus)}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers,
      });

      if (res.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!res.ok) {
        const dadosErro = await res.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao atualizar status (Status ${res.status})`);
      }

      const osAtualizada: OrdemServico = await res.json();
      setOs(osAtualizada);
      sincronizarChecklist(osAtualizada.checklist);
      setMensagemSucesso(`Status atualizado com sucesso para: ${novoStatus}!`);

      // Se a OS foi CONCLUÍDA e possui agendamento vinculado, tenta atualizar o agendamento para CONCLUIDO
      // (Conforme confirmado, o endpoint do AgendamentoController também recebe status via query string)
      if (novoStatus === 'CONCLUIDA' && os.agendamento?.id) {
        try {
          const urlAg = `${apiHost}/agendamentos/${encodeURIComponent(os.agendamento.id)}/status?status=CONCLUIDO`;
          const resAg = await fetch(urlAg, {
            method: 'PATCH',
            headers,
          });
          if (!resAg.ok) {
            setAvisoAgendamento(
              `A OS #${id} foi concluída com sucesso, mas o agendamento vinculado #${os.agendamento.id} não pôde ser atualizado automaticamente. Atualize-o na tela de agendamentos se necessário.`
            );
          }
        } catch {
          setAvisoAgendamento(
            `A OS #${id} foi concluída, porém houve falha na comunicação ao tentar atualizar o agendamento vinculado.`
          );
        }
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao alterar status da OS.');
    } finally {
      setAtualizandoStatus(false);
    }
  }

  /**
   * Salvar Checklist Técnico:
   * Endpoint: POST /api/ordens-servico/:id/checklist
   * O backend executa um prisma.checklist.upsert(). Enviamos SEMPRE os 5 campos
   * com o estado atual da tela para garantir que o checklist seja atualizado fielmente.
   */
  async function handleSalvarChecklist(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setErro(null);
    setMensagemSucesso(null);
    setSalvandoChecklist(true);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const payload = {
      pressaoOk,
      temperaturaOk,
      limpezaOk,
      vazamentoVerificado,
      observacoesGerais: observacoesGerais.trim() || null,
    };

    try {
      const res = await fetch(`${apiHost}/ordens-servico/${id}/checklist`, {
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
        throw new Error(dadosErro.error || `Erro ao salvar checklist (Status ${res.status})`);
      }

      const osAtualizada: OrdemServico = await res.json();
      setOs(osAtualizada);
      sincronizarChecklist(osAtualizada.checklist);
      setMensagemSucesso('Checklist técnico salvo com sucesso!');
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar checklist técnico.');
    } finally {
      setSalvandoChecklist(false);
    }
  }

  /**
   * Adição de Material à Ordem de Serviço:
   * Endpoint: POST /api/ordens-servico/:id/materiais?idMaterial=...&quantidade=...
   * Note: O controller lê 'req.query.idMaterial' e 'req.query.quantidade'. Não há corpo JSON.
   * Usamos encodeURIComponent nos parâmetros de URL por segurança.
   * O backend copia o precoUnitario do material e recalcula o valorTotal da OS.
   */
  async function handleAdicionarMaterial(e: FormEvent) {
    e.preventDefault();
    if (!id || !materialSelecionadoId) {
      setErro('Selecione um material da lista.');
      return;
    }

    const qtd = Math.floor(Number(quantidadeMaterial));
    if (isNaN(qtd) || qtd < 1) {
      setErro('A quantidade de material deve ser um número inteiro igual ou superior a 1.');
      return;
    }

    const materialEncontrado = materiaisDisponiveis.find((m) => m.id === materialSelecionadoId);
    const descricaoMat = materialEncontrado?.descricao || 'Material';

    // Confirmação explícita pois o backend não oferece endpoint para exclusão de materiais já lançados
    const confirmou = window.confirm(
      `Confirma a adição de:\n\n${qtd} × "${descricaoMat}"\n\n` +
      `Atenção: O sistema não permite remover peças após o lançamento na OS.`
    );
    if (!confirmou) return;

    setErro(null);
    setMensagemSucesso(null);
    setSalvandoMaterial(true);

    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const url = `${apiHost}/ordens-servico/${id}/materiais?idMaterial=${encodeURIComponent(
        materialSelecionadoId
      )}&quantidade=${encodeURIComponent(qtd)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (res.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!res.ok) {
        const dadosErro = await res.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao adicionar material (Status ${res.status})`);
      }

      const osAtualizada: OrdemServico = await res.json();
      setOs(osAtualizada);
      setMaterialSelecionadoId('');
      setQuantidadeMaterial(1);
      setMensagemSucesso(`Material "${descricaoMat}" adicionado à OS com sucesso!`);
    } catch (err: any) {
      setErro(err.message || 'Falha ao adicionar material.');
    } finally {
      setSalvandoMaterial(false);
    }
  }

  // Verifica se a OS está em status terminal (não permite novos materiais ou alterações de status)
  const isTerminal = os?.status === 'CONCLUIDA' || os?.status === 'CANCELADA';

  // Subtotal calculado dos materiais para exibição transparente no resumo financeiro
  const subtotalMateriais = (os?.itensMaterial || []).reduce(
    (acc, item) => acc + (item.valorTotalItem || item.quantidade * item.precoUnitarioCobrado),
    0
  );

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 1200 }}>
      {/* Navegação / Breadcrumb */}
      <div className="mb-4 d-print-none">
        <Link
          to="/dashboard"
          className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2"
        >
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para o Dashboard
        </Link>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h3 className="fw-bold text-dark mb-0">Ordem de Serviço #{id}</h3>
              {renderBadgeStatus(os?.status)}
            </div>
            <p className="text-muted small mb-0 mt-1">
              {os?.cliente ? `Cliente: ${os.cliente.nome}` : 'Detalhes do atendimento'}
            </p>
          </div>

          {/* Botões de Ação de Mudança de Status e Impressão */}
          <div className="d-flex flex-wrap gap-2 d-print-none">
            {/* Botão de Impressão via window.print() */}
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
              onClick={() => window.print()}
              title="Imprimir relatório da Ordem de Serviço"
            >
              <span className="material-symbols-outlined fs-5">print</span>
              Imprimir OS
            </button>
            {os?.status === 'ABERTA' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-1 shadow-sm"
                  disabled={atualizandoStatus}
                  onClick={() => handleMudarStatus('EM_ANDAMENTO')}
                >
                  <span className="material-symbols-outlined fs-5">play_arrow</span>
                  Iniciar Atendimento
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger d-flex align-items-center gap-1"
                  disabled={atualizandoStatus}
                  onClick={() => handleMudarStatus('CANCELADA')}
                >
                  <span className="material-symbols-outlined fs-5">cancel</span>
                  Cancelar OS
                </button>
              </>
            )}

            {os?.status === 'EM_ANDAMENTO' && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary d-flex align-items-center gap-1"
                  disabled={atualizandoStatus}
                  onClick={() => handleMudarStatus('PAUSADA')}
                >
                  <span className="material-symbols-outlined fs-5">pause</span>
                  Pausar
                </button>
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-1 shadow-sm"
                  disabled={atualizandoStatus}
                  onClick={() => handleMudarStatus('CONCLUIDA')}
                >
                  <span className="material-symbols-outlined fs-5">task_alt</span>
                  Concluir OS
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger d-flex align-items-center gap-1"
                  disabled={atualizandoStatus}
                  onClick={() => handleMudarStatus('CANCELADA')}
                >
                  <span className="material-symbols-outlined fs-5">cancel</span>
                  Cancelar
                </button>
              </>
            )}

            {os?.status === 'PAUSADA' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-1 shadow-sm"
                  disabled={atualizandoStatus}
                  onClick={() => handleMudarStatus('EM_ANDAMENTO')}
                >
                  <span className="material-symbols-outlined fs-5">play_arrow</span>
                  Retomar Atendimento
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger d-flex align-items-center gap-1"
                  disabled={atualizandoStatus}
                  onClick={() => handleMudarStatus('CANCELADA')}
                >
                  <span className="material-symbols-outlined fs-5">cancel</span>
                  Cancelar OS
                </button>
              </>
            )}

            {isTerminal && (
              <span className="text-muted small align-self-center fst-italic">
                OS em status final ({os?.status}). Nenhuma alteração de status permitida.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Sucesso, Aviso e Erro */}
      {mensagemSucesso && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 py-2 mb-3 d-print-none" role="alert">
          <span className="material-symbols-outlined fs-5">check_circle</span>
          <small>{mensagemSucesso}</small>
          <button type="button" className="btn-close" onClick={() => setMensagemSucesso(null)} aria-label="Close"></button>
        </div>
      )}

      {avisoAgendamento && (
        <div className="alert alert-warning alert-dismissible fade show d-flex align-items-center gap-2 py-2 mb-3 d-print-none" role="alert">
          <span className="material-symbols-outlined fs-5">warning</span>
          <small>{avisoAgendamento}</small>
          <button type="button" className="btn-close" onClick={() => setAvisoAgendamento(null)} aria-label="Close"></button>
        </div>
      )}

      {erro && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 py-2 mb-3 d-print-none" role="alert">
          <span className="material-symbols-outlined fs-5">error</span>
          <small>{erro}</small>
          <button type="button" className="btn-close" onClick={() => setErro(null)} aria-label="Close"></button>
        </div>
      )}

      {carregando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted small">Carregando dados da ordem de serviço...</p>
        </div>
      ) : os ? (
        <div className="row g-4">
          {/* Coluna da Esquerda: Dados Gerais, Equipamento e Checklist Técnico */}
          <div className="col-lg-7">
            {/* 1. Card com Dados Gerais e Equipamento */}
            <div className="card shadow-sm border-0 p-4 mb-4">
              <h5 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <span className="material-symbols-outlined fs-5">info</span>
                Informações do Atendimento
              </h5>

              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="small text-muted fw-semibold">Cliente</div>
                  <div className="fw-bold text-dark">{os.cliente?.nome || 'Não informado'}</div>
                  <div className="text-muted small">ID: #{os.cliente?.id}</div>
                </div>

                <div className="col-sm-6">
                  <div className="small text-muted fw-semibold">Técnico Responsável</div>
                  <div className="fw-bold text-dark">{os.tecnico?.nome || 'A definir'}</div>
                  <div className="text-muted small">ID: #{os.tecnico?.id}</div>
                </div>

                <div className="col-sm-6">
                  <div className="small text-muted fw-semibold">Data de Abertura</div>
                  <div className="text-dark small">
                    {new Date(os.dataAbertura).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="small text-muted fw-semibold">Data de Conclusão</div>
                  <div className="text-dark small">
                    {os.dataConclusao
                      ? new Date(os.dataConclusao).toLocaleString('pt-BR')
                      : 'Em aberto'}
                  </div>
                </div>

                <div className="col-12 pt-2 border-top">
                  <div className="small text-muted fw-semibold mb-1">Equipamento em Atendimento</div>
                  {os.equipamento ? (
                    <div className="bg-light p-3 rounded">
                      <div className="fw-bold text-dark">
                        {os.equipamento.marca} — {os.equipamento.modelo}
                      </div>
                      <div className="text-muted small mb-2">
                        <strong>Nº de Série:</strong> {os.equipamento.numeroSerie}
                      </div>
                      <div className="small">
                        <span className="fw-semibold text-secondary">Problema relatado pelo cliente: </span>
                        <em>"{os.equipamento.problemaRelatado}"</em>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted small fst-italic">Equipamento não especificado.</div>
                  )}
                </div>

                <div className="col-12 pt-2 border-top">
                  <div className="small text-muted fw-semibold mb-1">Diagnóstico Técnico</div>
                  <div className="bg-light p-3 rounded small text-dark">
                    {os.diagnosticoTecnico || 'Nenhum diagnóstico preliminar registrado na abertura.'}
                  </div>
                  <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                    Nota: O diagnóstico técnico registrado na abertura da OS não pode ser alterado após a criação (limitação do backend).
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Card de Checklist Técnico Interativo (upsert no backend) */}
            <div className="card shadow-sm border-0 p-4">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <h5 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined fs-5">fact_check</span>
                  Checklist Técnico
                </h5>
                <span className="badge bg-light text-muted border">
                  {os.checklist ? 'Checklist preenchido' : 'Pendente de preenchimento'}
                </span>
              </div>

              <form onSubmit={handleSalvarChecklist}>
                <p className="text-muted small mb-3">
                  Verifique e assinale os itens técnicos inspecionados no ar-condicionado.
                </p>

                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <div className="form-check p-3 bg-light rounded border">
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        id="checkPressao"
                        checked={pressaoOk}
                        onChange={(e) => setPressaoOk(e.target.checked)}
                      />
                      <label className="form-check-label fw-semibold small" htmlFor="checkPressao">
                        Pressão do Gás OK
                      </label>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="form-check p-3 bg-light rounded border">
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        id="checkTemperatura"
                        checked={temperaturaOk}
                        onChange={(e) => setTemperaturaOk(e.target.checked)}
                      />
                      <label className="form-check-label fw-semibold small" htmlFor="checkTemperatura">
                        Temperatura do Ar OK
                      </label>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="form-check p-3 bg-light rounded border">
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        id="checkLimpeza"
                        checked={limpezaOk}
                        onChange={(e) => setLimpezaOk(e.target.checked)}
                      />
                      <label className="form-check-label fw-semibold small" htmlFor="checkLimpeza">
                        Limpeza e Filtros OK
                      </label>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="form-check p-3 bg-light rounded border">
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        id="checkVazamento"
                        checked={vazamentoVerificado}
                        onChange={(e) => setVazamentoVerificado(e.target.checked)}
                      />
                      <label className="form-check-label fw-semibold small" htmlFor="checkVazamento">
                        Vazamento Verificado
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Observações Gerais do Checklist</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Observações do técnico sobre testes, medições e procedimentos realizados..."
                    value={observacoesGerais}
                    onChange={(e) => setObservacoesGerais(e.target.value)}
                  />
                </div>

                <div className="d-flex justify-content-end d-print-none">
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
                    disabled={salvandoChecklist}
                  >
                    {salvandoChecklist ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <span className="material-symbols-outlined fs-5">save</span>
                    )}
                    {salvandoChecklist ? 'Salvando...' : 'Salvar Checklist'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Coluna da Direita: Materiais Utilizados e Resumo Financeiro */}
          <div className="col-lg-5">
            {/* 1. Materiais Utilizados */}
            <div className="card shadow-sm border-0 p-4 mb-4">
              <h5 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <span className="material-symbols-outlined fs-5">inventory_2</span>
                Materiais e Peças Utilizadas
              </h5>

              {/* Tabela de Materiais Lançados */}
              {os.itensMaterial && os.itensMaterial.length > 0 ? (
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Descrição</th>
                        <th className="text-center">Qtd</th>
                        <th className="text-end">Unitário</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {os.itensMaterial.map((item) => (
                        <tr key={item.id}>
                          <td>{item.material?.descricao || 'Material'}</td>
                          <td className="text-center">{item.quantidade}</td>
                          <td className="text-end">
                            {Number(item.precoUnitarioCobrado).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                          <td className="text-end fw-semibold">
                            {Number(item.valorTotalItem || item.quantidade * item.precoUnitarioCobrado).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3 text-muted small bg-light rounded mb-3">
                  Nenhum material adicionado a esta OS até o momento.
                </div>
              )}

              {/* Formulário de Adição de Material */}
              {isTerminal ? (
                <div className="alert alert-secondary py-2 small mb-0 d-print-none">
                  <span className="fw-semibold">Lançamentos bloqueados:</span> Não é permitido adicionar materiais a uma OS concluída ou cancelada.
                </div>
              ) : (
                <form onSubmit={handleAdicionarMaterial} className="pt-2 border-top d-print-none">
                  <div className="fw-semibold small text-dark mb-2 d-flex align-items-center gap-1">
                    <span className="material-symbols-outlined fs-6 text-primary">add_circle</span>
                    Lançar Material na OS
                  </div>

                  <div className="mb-2">
                    <label className="form-label small text-muted mb-1">Selecionar Peça / Insumo *</label>
                    <select
                      className="form-select form-select-sm"
                      value={materialSelecionadoId}
                      onChange={(e) => setMaterialSelecionadoId(e.target.value)}
                      required
                    >
                      <option value="">Selecione um material...</option>
                      {materiaisDisponiveis.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.descricao} ({m.unidade}) —{' '}
                          {Number(m.precoUnitario).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 align-items-end mb-2">
                    <div className="col-sm-5">
                      <label className="form-label small text-muted mb-1">Quantidade *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="1"
                        step="1"
                        value={quantidadeMaterial}
                        onChange={(e) => setQuantidadeMaterial(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-sm-7">
                      <button
                        type="submit"
                        className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                        disabled={salvandoMaterial || !materialSelecionadoId}
                      >
                        {salvandoMaterial ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <span className="material-symbols-outlined fs-6">add</span>
                        )}
                        {salvandoMaterial ? 'Lançando...' : 'Adicionar Item'}
                      </button>
                    </div>
                  </div>

                  <div className="form-text text-muted" style={{ fontSize: '0.72rem' }}>
                    O preço unitário é copiado do cadastro do material. O sistema recalcula o valor total automaticamente.
                  </div>
                </form>
              )}
            </div>

            {/* 2. Resumo Financeiro */}
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <span className="material-symbols-outlined fs-5">payments</span>
                Resumo Financeiro
              </h5>

              <div className="d-flex justify-content-between align-items-center py-2 border-bottom small">
                <span className="text-muted">Valor de Mão de Obra:</span>
                <span className="fw-semibold text-dark">
                  {Number(os.valorMaoDeObra).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center py-2 border-bottom small">
                <span className="text-muted">Total de Peças e Materiais:</span>
                <span className="fw-semibold text-dark">
                  {subtotalMateriais.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-3 pb-1">
                <span className="fw-bold fs-6 text-dark">Valor Total da OS:</span>
                <span className="fw-bold fs-5 text-primary">
                  {/* Exibe o valorTotal calculado e mantido pelo próprio backend */}
                  {Number(os.valorTotal).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                Total consolidado retornado pelo servidor.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
