import { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router';
import type { OrdemServico, StatusOS } from '../types/OrdemServico';

type OrdemServicoDetalheProps = {
  onLogout: () => void;
};

/**
 * Componente de Visualização da Ordem de Serviço
 * Implementação completa com checklist e materiais na Fase 6.
 * Criado nesta fase para permitir navegação funcional a partir da tabela do Dashboard.
 */
export function OrdemServicoDetalhe({ onLogout }: OrdemServicoDetalheProps) {
  const { id } = useParams<{ id: string }>();
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  useEffect(() => {
    async function fetchOS() {
      if (!id) return;
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${apiHost}/ordens-servico/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!res.ok) {
          throw new Error(`Ordem de serviço #${id} não encontrada (Status ${res.status})`);
        }

        const data: OrdemServico = await res.json();
        setOs(data);
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar detalhes da ordem de serviço.');
      } finally {
        setCarregando(false);
      }
    }

    fetchOS();
  }, [id]);

  function renderBadgeStatus(status?: StatusOS) {
    if (!status) return null;
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
      {/* Navegação / Breadcrumb */}
      <div className="mb-4">
        <NavLink to="/dashboard" className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2">
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para o Dashboard
        </NavLink>
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="fw-bold text-dark mb-0">Ordem de Serviço #{id}</h3>
          {renderBadgeStatus(os?.status)}
        </div>
      </div>

      {/* Aviso de Fase de Desenvolvimento */}
      <div className="alert alert-info py-2 d-flex align-items-center gap-2 mb-4" role="alert">
        <span className="material-symbols-outlined fs-5">info</span>
        <small>
          <strong>Fase 3/4:</strong> Esta visualização apresenta os dados básicos da OS. O fluxo completo de execução técnica (checklist interativo, adição de materiais e finalização) será implementado na <strong>Fase 6</strong>.
        </small>
      </div>

      {erro && (
        <div className="alert alert-danger py-2" role="alert">
          <small>{erro}</small>
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
          {/* Dados do Cliente */}
          <div className="col-md-6">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Dados do Cliente
              </h5>
              <p className="mb-1"><strong>Nome:</strong> {os.cliente?.nome || 'Não informado'}</p>
              <p className="mb-1 text-muted small"><strong>ID Cliente:</strong> #{os.cliente?.id}</p>
            </div>
          </div>

          {/* Dados do Serviço e Técnico */}
          <div className="col-md-6">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <span className="material-symbols-outlined text-primary">engineering</span>
                Dados Técnicos
              </h5>
              <p className="mb-1"><strong>Técnico Responsável:</strong> {os.tecnico?.nome || 'A definir'}</p>
              <p className="mb-1"><strong>Equipamento:</strong> {os.equipamento?.modelo || 'Não especificado'}</p>
              <p className="mb-1"><strong>Valor Total:</strong> R$ {os.valorTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
