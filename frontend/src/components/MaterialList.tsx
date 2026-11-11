import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Material } from '../types/Material';

type MaterialListProps = {
  onLogout: () => void;
};

/**
 * Componente de Listagem de Materiais e Peças (Fase 7A)
 *
 * Funcionalidades:
 * - Listagem de todos os materiais (GET /api/materiais).
 * - Busca de materiais por descrição (GET /api/materiais/busca?descricao=...).
 * - Exclusão de material com confirmação (DELETE /api/materiais/:id).
 *   Caso o material já esteja vinculado a itens de alguma Ordem de Serviço, o backend
 *   recusa a exclusão e a mensagem de erro específica é exibida.
 * - Link para novo cadastro (/materiais/novo) e edição (/materiais/:id/editar).
 */
export function MaterialList({ onLogout }: MaterialListProps) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  async function carregarMateriais(descricao?: string) {
    setCarregando(true);
    setErro(null);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      const url = descricao && descricao.trim()
        ? `${apiHost}/materiais/busca?descricao=${encodeURIComponent(descricao.trim())}`
        : `${apiHost}/materiais`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        throw new Error(`Falha ao buscar materiais (Status ${response.status})`);
      }

      const data: Material[] = await response.json();
      setMateriais(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar materiais.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMateriais();
  }, []);

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    carregarMateriais(termoBusca);
  }

  function handleLimparBusca() {
    setTermoBusca('');
    carregarMateriais('');
  }

  /**
   * Exclusão de material
   * Endpoint: DELETE /api/materiais/:id
   */
  async function handleExcluir(material: Material) {
    const confirmou = window.confirm(
      `Deseja realmente excluir o material "${material.descricao}"?\n\n` +
      `Atenção: Se este material já foi utilizado em alguma Ordem de Serviço, a exclusão será recusada pelo sistema.`
    );
    if (!confirmou) return;

    setExcluindoId(material.id);
    setErro(null);
    setSucesso(null);

    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${apiHost}/materiais/${material.id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        const dadosErro = await response.json().catch(() => ({}));
        const msgErro = dadosErro.error || '';

        // Trata erro cru de Foreign Key / RESTRICT do Prisma/PostgreSQL com mensagem amigável
        if (/foreign key|violates|RESTRICT/i.test(msgErro)) {
          throw new Error('Não é possível excluir este material porque ele já foi usado em ordens de serviço.');
        }

        throw new Error(msgErro || `Não foi possível excluir o material. Ele pode estar vinculado a ordens de serviço existentes.`);
      }

      // Atualiza a lista em memória sem recarregar a página
      setMateriais((prev) => prev.filter((m) => m.id !== material.id));
      setSucesso(`Material "${material.descricao}" excluído com sucesso!`);
    } catch (err: any) {
      setErro(err.message || 'Falha ao excluir material.');
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* Cabeçalho */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Catálogo de Materiais e Peças</h3>
          <p className="text-muted small mb-0">Gerencie insumos, peças de reposição e preços unitários</p>
        </div>
        <Link to="/materiais/novo" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined fs-5">add</span>
          Novo Material
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
                placeholder="Buscar material por descrição (ex: gás, capacitor, tubo)..."
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

      {/* Tabela de Materiais */}
      <div className="card shadow-sm border-0 p-3">
        {carregando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="text-muted small">Carregando materiais...</p>
          </div>
        ) : materiais.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined fs-1 text-muted mb-2">inventory_2</span>
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
                  <th>Descrição</th>
                  <th className="text-center">Unidade</th>
                  <th className="text-end">Preço Unitário</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map((mat) => (
                  <tr key={mat.id}>
                    <td>
                      <div className="fw-bold text-dark">{mat.descricao}</div>
                      <div className="text-muted small">ID #{mat.id}</div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">
                        {mat.unidade}
                      </span>
                    </td>
                    <td className="text-end fw-semibold text-dark">
                      {Number(mat.precoUnitario).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {/* Editar */}
                        <Link
                          to={`/materiais/${mat.id}/editar`}
                          className="btn btn-outline-primary btn-sm py-1 px-2 d-flex align-items-center gap-1"
                          title="Editar material"
                        >
                          <span className="material-symbols-outlined fs-6">edit</span>
                          <span className="d-none d-lg-inline" style={{ fontSize: '0.75rem' }}>Editar</span>
                        </Link>

                        {/* Excluir */}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm py-1 px-2 d-flex align-items-center gap-1"
                          title="Excluir material"
                          disabled={excluindoId === mat.id}
                          onClick={() => handleExcluir(mat)}
                        >
                          <span className="material-symbols-outlined fs-6">delete</span>
                          <span className="d-none d-lg-inline" style={{ fontSize: '0.75rem' }}>Excluir</span>
                        </button>
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

