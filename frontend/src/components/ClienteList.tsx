import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Cliente } from '../types/Cliente';

type ClienteListProps = {
  onLogout: () => void;
};

/**
 * Componente de Listagem de Clientes (ClienteList)
 * Permite visualizar, buscar por nome, navegar para criação/edição e excluir clientes.
 * 
 * Padrões PP2:
 * - Chamadas via fetch nativo dentro de funções assíncronas com try/catch.
 * - Busca ativada via formulário/botão (ou Enter), sem disparar a cada caractere digitado.
 * - Tratamento padronizado de HTTP 401 limpando token e redirecionando para /login.
 */
export function ClienteList({ onLogout }: ClienteListProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  /**
   * Trata respostas 401 Não Autorizado / Token Expirado
   */
  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  /**
   * Busca a lista de clientes no backend.
   * Se 'nomeFiltro' for fornecido, consulta GET /api/clientes/busca?nome=...
   * Se 'nomeFiltro' for vazio, lista todos via GET /api/clientes
   */
  async function carregarClientes(nomeFiltro?: string) {
    setCarregando(true);
    setErro(null);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      const url = nomeFiltro && nomeFiltro.trim() !== ''
        ? `${apiHost}/clientes/busca?nome=${encodeURIComponent(nomeFiltro.trim())}`
        : `${apiHost}/clientes`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        const dadosErro = await response.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao carregar clientes (Status ${response.status})`);
      }

      const data: Cliente[] = await response.json();
      setClientes(data);
    } catch (err: any) {
      setErro(err.message || 'Falha ao buscar clientes no servidor.');
    } finally {
      setCarregando(false);
    }
  }

  // Carrega todos os clientes na montagem inicial do componente
  useEffect(() => {
    carregarClientes();
  }, []);

  /**
   * Dispara a busca quando o usuário clica em "Buscar" ou pressiona Enter
   */
  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    setSucesso(null);
    carregarClientes(termoBusca);
  }

  /**
   * Limpa o campo de busca e recarrega todos os clientes
   */
  function handleLimparBusca() {
    setTermoBusca('');
    setSucesso(null);
    carregarClientes('');
  }

  /**
   * Exclui um cliente após confirmação do usuário (window.confirm)
   * Endpoint: DELETE /api/clientes/:id
   */
  async function handleExcluir(cliente: Cliente) {
    const confirmou = window.confirm(
      `Deseja realmente excluir o cliente "${cliente.nome}" (CPF: ${cliente.cpf})?\nEsta ação não poderá ser desfeita.`
    );

    if (!confirmou) return;

    setErro(null);
    setSucesso(null);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${apiHost}/clientes/${cliente.id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        // Se o backend recusar (por exemplo, cliente vinculado a ordens de serviço ou agendamentos)
        const dadosErro = await response.json().catch(() => ({}));
        const msgErro = dadosErro.error || '';

        // Trata erro cru de Foreign Key / RESTRICT do Prisma/PostgreSQL com mensagem amigável
        if (/foreign key|violates|RESTRICT/i.test(msgErro)) {
          throw new Error('Não é possível excluir este cliente porque ele possui agendamentos ou ordens de serviço vinculados.');
        }

        throw new Error(
          msgErro || `Não foi possível excluir o cliente (Status ${response.status}). Verifique se ele possui ordens de serviço vinculadas.`
        );
      }

      // Remove o cliente da lista local
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
      setSucesso(`Cliente "${cliente.nome}" excluído com sucesso.`);
    } catch (err: any) {
      setErro(err.message || 'Erro ao tentar excluir cliente.');
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* Cabeçalho da Seção */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Clientes</h3>
          <p className="text-muted small mb-0">Gestão e cadastro de clientes do sistema</p>
        </div>
        <Link to="/clientes/novo" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined fs-6">person_add</span>
          Novo Cliente
        </Link>
      </div>

      {/* Alertas de Sucesso e Erro */}
      {sucesso && (
        <div className="alert alert-success alert-dismissible fade show py-2 mb-3 d-flex align-items-center gap-2" role="alert">
          <span className="material-symbols-outlined fs-5">check_circle</span>
          <small>{sucesso}</small>
          <button type="button" className="btn-close py-2" onClick={() => setSucesso(null)} aria-label="Close"></button>
        </div>
      )}

      {erro && (
        <div className="alert alert-danger alert-dismissible fade show py-2 mb-3 d-flex align-items-center gap-2" role="alert">
          <span className="material-symbols-outlined fs-5">error</span>
          <small>{erro}</small>
          <button type="button" className="btn-close py-2" onClick={() => setErro(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Formulário de Busca por Nome (acionado por botão ou Enter) */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <form onSubmit={handleBuscar} className="row g-2 align-items-center">
          <div className="col-12 col-md-8 col-lg-9">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <span className="material-symbols-outlined text-muted fs-5">search</span>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar cliente por nome..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 col-lg-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-1">
              <span className="material-symbols-outlined fs-6">search</span>
              Buscar
            </button>
            {termoBusca && (
              <button
                type="button"
                onClick={handleLimparBusca}
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                title="Limpar busca"
              >
                <span className="material-symbols-outlined fs-6">close</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela de Clientes */}
      <div className="card shadow-sm border-0 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h6 className="fw-bold text-dark mb-0">Clientes Cadastrados</h6>
          <span className="badge bg-light text-muted border">Total: {clientes.length}</span>
        </div>

        {carregando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="text-muted small">Carregando clientes...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Endereço</th>
                  <th className="text-end" style={{ width: '150px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4 small">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold text-muted">#{c.id}</td>
                      <td className="text-dark fw-semibold">{c.nome}</td>
                      <td className="text-muted small">{c.cpf}</td>
                      <td className="text-muted small">{c.telefone}</td>
                      <td className="text-muted small">{c.email}</td>
                      <td className="text-muted small text-truncate" style={{ maxWidth: 220 }} title={c.endereco}>
                        {c.endereco}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/clientes/${c.id}/editar`}
                            className="btn btn-outline-secondary"
                            title="Editar cliente"
                          >
                            <span className="material-symbols-outlined fs-6">edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleExcluir(c)}
                            className="btn btn-outline-danger"
                            title="Excluir cliente"
                          >
                            <span className="material-symbols-outlined fs-6">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
