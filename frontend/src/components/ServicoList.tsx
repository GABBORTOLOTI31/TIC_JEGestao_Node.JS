import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Servico } from '../types/Servico';

type ServicoListProps = {
  onLogout: () => void;
};

/**
 * Componente de Listagem de Serviços (Fase 7A)
 *
 * Funcionalidades:
 * - Listagem de todos os serviços (GET /api/servicos).
 * - Busca de serviços por nome (GET /api/servicos/busca?nome=...).
 * - Ativação e Inativação via PATCH /api/servicos/:id/status.
 * - Exibição de duração estimada em minutos e valor base formatado em reais (BRL).
 * - Link para novo cadastro (/servicos/novo) e edição (/servicos/:id/editar).
 */
export function ServicoList({ onLogout }: ServicoListProps) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [alterandoStatusId, setAlterandoStatusId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  async function carregarServicos(nome?: string) {
    setCarregando(true);
    setErro(null);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      const url = nome && nome.trim()
        ? `${apiHost}/servicos/busca?nome=${encodeURIComponent(nome.trim())}`
        : `${apiHost}/servicos`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        throw new Error(`Falha ao buscar serviços (Status ${response.status})`);
      }

      const data: Servico[] = await response.json();
      setServicos(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar serviços.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarServicos();
  }, []);

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    carregarServicos(termoBusca);
  }

  function handleLimparBusca() {
    setTermoBusca('');
    carregarServicos('');
  }

  /**
   * Alterna status do serviço (ativo/inativo)
   * Endpoint: PATCH /api/servicos/:id/status
   */
  async function handleToggleStatus(servico: Servico) {
    const acao = servico.ativo ? 'inativar' : 'ativar';
    const confirmou = window.confirm(
      `Deseja realmente ${acao} o serviço "${servico.nome}"?`
    );
    if (!confirmou) return;

    setAlterandoStatusId(servico.id);
    setErro(null);
    setSucesso(null);

    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${apiHost}/servicos/${servico.id}/status`, {
        method: 'PATCH',
        headers,
      });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        const dadosErro = await response.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao alterar status do serviço (Status ${response.status})`);
      }

      const servicoAtualizado: Servico = await response.json();

      setServicos((prev) =>
        prev.map((s) => (s.id === servicoAtualizado.id ? servicoAtualizado : s))
      );
      setSucesso(`Serviço "${servicoAtualizado.nome}" ${servicoAtualizado.ativo ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (err: any) {
      setErro(err.message || 'Falha ao alterar status do serviço.');
    } finally {
      setAlterandoStatusId(null);
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* Cabeçalho */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Catálogo de Serviços</h3>
          <p className="text-muted small mb-0">Gerencie os tipos de manutenção, instalação e valores base oferecidos</p>
        </div>
        <Link to="/servicos/novo" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined fs-5">add</span>
          Novo Serviço
        </Link>
      </div>

      {/* Alertas */}
      {sucesso && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 py-2 mb-3" role="alert">
          <span className="material-symbols-outlined fs-5">check_circle</span>
          <small>{sucesso}</small>
          <button type="button" className="btn-close" onClick={() => setSucesso(null)}></button>
        </div>
      )}

      {erro && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 py-2 mb-3" role="alert">
          <span className="material-symbols-outlined fs-5">error</span>
          <small>{erro}</small>
          <button type="button" className="btn-close" onClick={() => setErro(null)}></button>
        </div>
      )}

      {/* Barra de Busca */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <form onSubmit={handleBuscar} className="row g-2 align-items-center">
          <div className="col-sm-9 col-md-10">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <span className="material-symbols-outlined fs-5 text-muted">search</span>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar serviço por nome..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
          </div>
          <div className="col-sm-3 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-primary w-100" disabled={carregando}>
              Buscar
            </button>
            {termoBusca && (
              <button type="button" onClick={handleLimparBusca} className="btn btn-outline-secondary" title="Limpar busca">
                <span className="material-symbols-outlined fs-6">close</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela de Serviços */}
      <div className="card shadow-sm border-0 p-3">
        {carregando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="text-muted small">Carregando serviços...</p>
          </div>
        ) : servicos.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined fs-1 text-muted mb-2">build</span>
            <p className="text-muted fw-semibold">Nenhum registro encontrado.</p>
            {termoBusca && (
              <button onClick={handleLimparBusca} className="btn btn-link btn-sm text-decoration-none">
                Limpar filtro de busca
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th>Serviço</th>
                  <th>Duração Estimada</th>
                  <th className="text-end">Valor Base</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {servicos.map((servico) => (
                  <tr key={servico.id}>
                    <td>
                      <div className="fw-bold text-dark">{servico.nome}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: 350 }}>
                        {servico.descricao || 'Sem descrição cadastrada'}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                        <span className="material-symbols-outlined fs-6">schedule</span>
                        {servico.duracaoEstimada} min
                      </span>
                    </td>
                    <td className="text-end fw-semibold text-dark">
                      {Number(servico.valorBase).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="text-center">
                      {servico.ativo ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          Ativo
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {/* Toggle Ativar/Inativar */}
                        <button
                          type="button"
                          className={`btn btn-sm ${servico.ativo ? 'btn-outline-secondary' : 'btn-outline-success'} py-1 px-2 d-flex align-items-center gap-1`}
                          title={servico.ativo ? 'Inativar serviço' : 'Ativar serviço'}
                          disabled={alterandoStatusId === servico.id}
                          onClick={() => handleToggleStatus(servico)}
                        >
                          <span className="material-symbols-outlined fs-6">
                            {servico.ativo ? 'toggle_on' : 'toggle_off'}
                          </span>
                          <span className="d-none d-lg-inline" style={{ fontSize: '0.75rem' }}>
                            {servico.ativo ? 'Inativar' : 'Ativar'}
                          </span>
                        </button>

                        {/* Editar */}
                        <Link
                          to={`/servicos/${servico.id}/editar`}
                          className="btn btn-outline-primary btn-sm py-1 px-2 d-flex align-items-center gap-1"
                          title="Editar dados do serviço"
                        >
                          <span className="material-symbols-outlined fs-6">edit</span>
                          <span className="d-none d-lg-inline" style={{ fontSize: '0.75rem' }}>Editar</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

