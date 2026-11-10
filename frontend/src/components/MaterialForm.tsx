import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import type { Material, NovoMaterial } from '../types/Material';

type MaterialFormProps = {
  onLogout: () => void;
};

/**
 * Componente de Formulário de Material / Peça (Fase 7A)
 * Reaproveitado para criação (/materiais/novo) e edição (/materiais/:id/editar).
 *
 * Características:
 * - Cadastro de novos materiais via POST /api/materiais.
 * - Atualização via PUT /api/materiais/:id.
 * - Aceita vírgula ou ponto decimal no preço unitário, impedindo valores negativos.
 * - Unidade de medida padronizada (UN, M, KG, L, ROLO, CX, PAR, etc.).
 */
export function MaterialForm({ onLogout }: MaterialFormProps) {
  const { id } = useParams<{ id: string }>();
  const isEdicao = Boolean(id);

  // Estados dos campos
  const [descricao, setDescricao] = useState('');
  const [unidade, setUnidade] = useState('UN');
  const [precoUnitarioStr, setPrecoUnitarioStr] = useState('50,00');

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

  useEffect(() => {
    if (!isEdicao || !id) return;

    async function carregarMaterial() {
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(`${apiHost}/materiais/${id}`, { headers });

        if (response.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!response.ok) {
          const dadosErro = await response.json().catch(() => ({}));
          throw new Error(dadosErro.error || `Material não encontrado (Status ${response.status})`);
        }

        const data: Material = await response.json();
        setDescricao(data.descricao);
        setUnidade(data.unidade || 'UN');
        setPrecoUnitarioStr(Number(data.precoUnitario).toFixed(2).replace('.', ','));
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados do material.');
      } finally {
        setCarregando(false);
      }
    }

    carregarMaterial();
  }, [id, isEdicao]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!descricao.trim()) {
      setErro('A descrição do material é obrigatória.');
      return;
    }
    if (!unidade.trim()) {
      setErro('A unidade de medida é obrigatória.');
      return;
    }

    const precoLimpo = precoUnitarioStr.replace(/\s/g, '').replace(',', '.');
    const precoUnitario = parseFloat(precoLimpo);

    if (isNaN(precoUnitario) || precoUnitario < 0) {
      setErro('O preço unitário deve ser um número válido e não pode ser negativo.');
      return;
    }

    setSalvando(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const payload: NovoMaterial = {
      descricao: descricao.trim(),
      unidade: unidade.trim().toUpperCase(),
      precoUnitario,
    };

    try {
      const url = isEdicao ? `${apiHost}/materiais/${id}` : `${apiHost}/materiais`;
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
        throw new Error(dadosErro.error || `Erro ao salvar material (Status ${response.status})`);
      }

      navigate('/materiais');
    } catch (err: any) {
      setErro(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 700 }}>
      {/* Navegação / Breadcrumb */}
      <div className="mb-4">
        <Link to="/materiais" className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2">
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para o Catálogo de Materiais
        </Link>
        <h3 className="fw-bold text-dark mb-1">
          {isEdicao ? `Editar Material #${id}` : 'Novo Material'}
        </h3>
        <p className="text-muted small mb-0">
          {isEdicao
            ? 'Atualize a descrição, unidade e preço unitário da peça'
            : 'Cadastre uma nova peça ou insumo para uso em Ordens de Serviço'}
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
          <p className="text-muted small">Carregando dados do material...</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Descrição do Material / Peça *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Gás Refrigerante R410A, Capacitor 35uF, Tubo de Cobre 3/8..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Unidade de Medida *</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    maxLength={10}
                    placeholder="Ex: UN, KG, M, L..."
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="visually-hidden">Sugestões</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><button type="button" className="dropdown-item" onClick={() => setUnidade('UN')}>UN (Unidade)</button></li>
                    <li><button type="button" className="dropdown-item" onClick={() => setUnidade('M')}>M (Metro)</button></li>
                    <li><button type="button" className="dropdown-item" onClick={() => setUnidade('KG')}>KG (Quilograma)</button></li>
                    <li><button type="button" className="dropdown-item" onClick={() => setUnidade('L')}>L (Litro)</button></li>
                    <li><button type="button" className="dropdown-item" onClick={() => setUnidade('ROLO')}>ROLO</button></li>
                    <li><button type="button" className="dropdown-item" onClick={() => setUnidade('CX')}>CX (Caixa)</button></li>
                    <li><button type="button" className="dropdown-item" onClick={() => setUnidade('PAR')}>PAR</button></li>
                  </ul>
                </div>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Abreviação da unidade de fornecimento.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Preço Unitário Cobrado (R$) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">R$</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="50,00"
                    value={precoUnitarioStr}
                    onChange={(e) => setPrecoUnitarioStr(e.target.value)}
                    required
                  />
                </div>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Preço padrão repassado na Ordem de Serviço.
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Link to="/materiais" className="btn btn-outline-secondary px-4">
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
                {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Material'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

