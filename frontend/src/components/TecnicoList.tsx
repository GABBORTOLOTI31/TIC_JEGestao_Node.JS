import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Tecnico } from '../types/Tecnico';

type TecnicoListProps = {
  onLogout: () => void;
};

/**
 * Componente de Listagem e Gestão de Técnicos (Fase 7A)
 *
 * Funcionalidades:
 * - Listagem de todos os técnicos cadastrados (GET /api/tecnicos).
 * - Busca de técnicos por nome (GET /api/tecnicos/busca?nome=...) acionada por botão "Buscar" ou Enter.
 * - Ativação e Inativação direta na lista via PATCH /api/tecnicos/:id/status (inverte o status ativo).
 * - Link para formulário de cadastro (/tecnicos/novo) e edição (/tecnicos/:id/editar).
 */
export function TecnicoList({ onLogout }: TecnicoListProps) {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
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

  /**
   * Busca técnicos no backend (todos ou filtrados por nome)
   */
  async function carregarTecnicos(nome?: string) {
    setCarregando(true);
    setErro(null);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      const url = nome && nome.trim()
        ? `${apiHost}/tecnicos/busca?nome=${encodeURIComponent(nome.trim())}`
        : `${apiHost}/tecnicos`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        throw new Error(`Falha ao buscar técnicos (Status ${response.status})`);
      }

      const data: Tecnico[] = await response.json();
      setTecnicos(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar técnicos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTecnicos();
  }, []);

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    carregarTecnicos(termoBusca);
  }

  function handleLimparBusca() {
    setTermoBusca('');
    carregarTecnicos('');
  }

  /**
   * Alterna status do técnico (ativo/inativo)
   * Endpoint: PATCH /api/tecnicos/:id/status
   */
  async function handleToggleStatus(tecnico: Tecnico) {
    const acao = tecnico.ativo ? 'inativar' : 'ativar';
    const confirmou = window.confirm(
      `Deseja realmente ${acao} o técnico "${tecnico.nome}"?`
    );
    if (!confirmou) return;

    setAlterandoStatusId(tecnico.id);
    setErro(null);
    setSucesso(null);

    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${apiHost}/tecnicos/${tecnico.id}/status`, {
        method: 'PATCH',
        headers,
      });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        const dadosErro = await response.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao alterar status do técnico (Status ${response.status})`);
      }

      const tecnicoAtualizado: Tecnico = await response.json();

      // Atualiza a lista em memória sem recarregar a página inteira
      setTecnicos((prev) =>
        prev.map((t) => (t.id === tecnicoAtualizado.id ? tecnicoAtualizado : t))
      );
      setSucesso(`Técnico "${tecnicoAtualizado.nome}" ${tecnicoAtualizado.ativo ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (err: any) {
      setErro(err.message || 'Falha ao alterar status do técnico.');
    } finally {
      setAlterandoStatusId(null);
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* Cabeçalho */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Equipe Técnica</h3>
          <p className="text-muted small mb-0">Gerencie os técnicos de climatização e seus registros profissionais</p>
        </div>
        <Link to="/tecnicos/novo" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined fs-5">person_add</span>
          Novo Técnico
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
                placeholder="Buscar técnico por nome..."
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

      {/* Tabela de Técnicos */}
      <div className="card shadow-sm border-0 p-3">
        {carregando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="text-muted small">Carregando técnicos...</p>
          </div>
        ) : tecnicos.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined fs-1 text-muted mb-2">engineering</span>
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
                  <th>Nome / Especialidade</th>
                  <th>Registro Profissional</th>
                  <th>Contato</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tecnicos.map((tecnico) => (
                  <tr key={tecnico.id}>
                    <td>
                      <div className="fw-bold text-dark">{tecnico.nome}</div>
                      <div className="text-muted small d-flex align-items-center gap-1">
                        <span className="material-symbols-outlined fs-6">handyman</span>
                        {tecnico.especialidade || 'Geral'}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {tecnico.nrRegistro || 'Não informado'}
                      </span>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        CPF: {tecnico.cpf}
                      </div>
                    </td>
                    <td>
                      <div className="small text-dark">{tecnico.telefone}</div>
                      <div className="text-muted small">{tecnico.email}</div>
                    </td>
                    <td className="text-center">
                      {tecnico.ativo ? (
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
                        {/* Botão de Toggle Ativar/Inativar */}
                        <button
                          type="button"
                          className={`btn btn-sm ${tecnico.ativo ? 'btn-outline-secondary' : 'btn-outline-success'} py-1 px-2 d-flex align-items-center gap-1`}
                          title={tecnico.ativo ? 'Inativar técnico' : 'Ativar técnico'}
                          disabled={alterandoStatusId === tecnico.id}
                          onClick={() => handleToggleStatus(tecnico)}
                        >
                          <span className="material-symbols-outlined fs-6">
                            {tecnico.ativo ? 'toggle_on' : 'toggle_off'}
                          </span>
                          <span className="d-none d-lg-inline" style={{ fontSize: '0.75rem' }}>
                            {tecnico.ativo ? 'Inativar' : 'Ativar'}
                          </span>
                        </button>

                        {/* Botão de Editar */}
                        <Link
                          to={`/tecnicos/${tecnico.id}/editar`}
                          className="btn btn-outline-primary btn-sm py-1 px-2 d-flex align-items-center gap-1"
                          title="Editar dados do técnico"
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

