import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import type { Servico, NovoServico } from '../types/Servico';

type ServicoFormProps = {
  onLogout: () => void;
};

/**
 * Componente de Formulário de Serviço (Fase 7A)
 * Reaproveitado para criação (/servicos/novo) e edição (/servicos/:id/editar).
 *
 * Características:
 * - Cadastro de novos serviços via POST /api/servicos.
 * - Atualização completa de serviço via PUT /api/servicos/:id (todos os campos são atualizáveis).
 * - Aceita vírgula ou ponto decimal no valor base, impedindo valores negativos.
 * - Valida duração estimada como número inteiro positivo em minutos.
 */
export function ServicoForm({ onLogout }: ServicoFormProps) {
  const { id } = useParams<{ id: string }>();
  const isEdicao = Boolean(id);

  // Estados dos campos
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorBaseStr, setValorBaseStr] = useState('150,00');
  const [duracaoEstimadaStr, setDuracaoEstimadaStr] = useState('60');

  // Estados de controle
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  /**
   * Se for edição, carrega os dados atuais do serviço
   */
  useEffect(() => {
    if (!isEdicao || !id) return;

    async function carregarServico() {
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(`${apiHost}/servicos/${id}`, { headers });

        if (response.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!response.ok) {
          const dadosErro = await response.json().catch(() => ({}));
          throw new Error(dadosErro.error || `Serviço não encontrado (Status ${response.status})`);
        }

        const data: Servico = await response.json();
        setNome(data.nome);
        setDescricao(data.descricao || '');
        setValorBaseStr(Number(data.valorBase).toFixed(2).replace('.', ','));
        setDuracaoEstimadaStr(String(data.duracaoEstimada || 60));
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados do serviço.');
      } finally {
        setCarregando(false);
      }
    }

    carregarServico();
  }, [id, isEdicao]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro('O nome do serviço é obrigatório.');
      return;
    }

    // Validação do valor base
    const valorLimpo = valorBaseStr.replace(/\s/g, '').replace(',', '.');
    const valorBase = parseFloat(valorLimpo);
    if (isNaN(valorBase) || valorBase < 0) {
      setErro('O valor base deve ser um número válido e não pode ser negativo.');
      return;
    }

    // Validação da duração estimada
    const duracaoEstimada = parseInt(duracaoEstimadaStr, 10);
    if (isNaN(duracaoEstimada) || duracaoEstimada <= 0) {
      setErro('A duração estimada deve ser um número inteiro positivo (em minutos).');
      return;
    }

    setSalvando(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const payload: NovoServico = {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      valorBase,
      duracaoEstimada,
    };

    try {
      const url = isEdicao ? `${apiHost}/servicos/${id}` : `${apiHost}/servicos`;
      const method = isEdicao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        tratarNaoAutorizado();
        return;
      }

      if (!response.ok) {
        const dadosErro = await response.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Erro ao salvar serviço (Status ${response.status})`);
      }

      navigate('/servicos');
    } catch (err: any) {
      setErro(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 800 }}>
      {/* Navegação / Breadcrumb */}
      <div className="mb-4">
        <Link to="/servicos" className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2">
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para o Catálogo de Serviços
        </Link>
        <h3 className="fw-bold text-dark mb-1">
          {isEdicao ? `Editar Serviço #${id}` : 'Novo Serviço'}
        </h3>
        <p className="text-muted small mb-0">
          {isEdicao
            ? 'Atualize o nome, duração e valor base do serviço'
            : 'Cadastre um novo serviço de climatização oferecido pela empresa'}
        </p>
      </div>

      {/* Alerta de Erro */}
      {erro && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4" role="alert">
          <span className="material-symbols-outlined fs-5">error</span>
          <small>{erro}</small>
        </div>
      )}

      {carregando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted small">Carregando dados do serviço...</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Nome do Serviço *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Instalação Split Hi-Wall, Higienização Completa, Manutenção Preventiva..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Descrição do Escopo do Serviço</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Detalhes sobre o que está incluso no atendimento, testes realizados, etc..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Valor Base (Mão de Obra) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">R$</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="150,00"
                    value={valorBaseStr}
                    onChange={(e) => setValorBaseStr(e.target.value)}
                    required
                  />
                </div>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Preço padrão de referência do serviço.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Duração Estimada (em minutos) *</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    step="1"
                    placeholder="60"
                    value={duracaoEstimadaStr}
                    onChange={(e) => setDuracaoEstimadaStr(e.target.value)}
                    required
                  />
                  <span className="input-group-text bg-light">minutos</span>
                </div>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Utilizado pelo sistema para validar conflitos de agenda dos técnicos.
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Link to="/servicos" className="btn btn-outline-secondary px-4">
                Cancelar
              </Link>
              <button
                type="submit"
                className="btn btn-primary px-4 d-flex align-items-center gap-2 shadow-sm"
                disabled={salvando}
              >
                {salvando ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <span className="material-symbols-outlined fs-5">save</span>
                )}
                {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Serviço'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

