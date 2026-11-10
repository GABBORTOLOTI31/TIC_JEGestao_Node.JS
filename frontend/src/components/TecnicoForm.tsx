import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import type { Tecnico, NovoTecnico, AtualizarTecnico } from '../types/Tecnico';

type TecnicoFormProps = {
  onLogout: () => void;
};

/**
 * Componente de Formulário de Técnico (Fase 7A)
 * Reaproveitado para criação (/tecnicos/novo) e edição (/tecnicos/:id/editar).
 *
 * Características e Regras do Backend:
 * - Na criação (POST /api/tecnicos): grava na tabela 'pessoas' e cria o vínculo em 'tecnicos'.
 *   Valida duplicidade de CPF e de nrRegistro (número de registro profissional).
 * - Na edição (PUT /api/tecnicos/:id): atualiza nome, telefone, email em 'pessoas' e especialidade e nrRegistro em 'tecnicos'.
 *   O CPF NÃO é editável pelo PUT, permanecendo desabilitado na tela.
 * - Não cria usuário de login (usuários são entidades separadas no sistema).
 */
export function TecnicoForm({ onLogout }: TecnicoFormProps) {
  const { id } = useParams<{ id: string }>();
  const isEdicao = Boolean(id);

  // Estados dos campos do formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [nrRegistro, setNrRegistro] = useState('');

  // Estados de controle e feedback
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
   * Se for edição, carrega os dados atuais do técnico
   */
  useEffect(() => {
    if (!isEdicao || !id) return;

    async function carregarTecnico() {
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(`${apiHost}/tecnicos/${id}`, { headers });

        if (response.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!response.ok) {
          const dadosErro = await response.json().catch(() => ({}));
          throw new Error(dadosErro.error || `Técnico não encontrado (Status ${response.status})`);
        }

        const data: Tecnico = await response.json();
        setNome(data.nome);
        setCpf(data.cpf);
        setTelefone(data.telefone);
        setEmail(data.email);
        setEspecialidade(data.especialidade || '');
        setNrRegistro(data.nrRegistro || '');
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados do técnico para edição.');
      } finally {
        setCarregando(false);
      }
    }

    carregarTecnico();
  }, [id, isEdicao]);

  /**
   * Submissão do formulário
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    // Validação de CPF no novo cadastro
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!isEdicao && cpfLimpo.length !== 11 && cpf.trim().length !== 14) {
      setErro('O CPF informado deve conter 11 dígitos numéricos ou 14 formatados (000.000.000-00).');
      return;
    }

    if (!nrRegistro.trim()) {
      setErro('O número de registro profissional é obrigatório.');
      return;
    }

    setSalvando(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      if (isEdicao) {
        // Atualização: PUT /api/tecnicos/:id
        const payload: AtualizarTecnico = {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          especialidade: especialidade.trim(),
          nrRegistro: nrRegistro.trim(),
        };

        const response = await fetch(`${apiHost}/tecnicos/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!response.ok) {
          const dadosErro = await response.json().catch(() => ({}));
          throw new Error(dadosErro.error || `Erro ao atualizar técnico (Status ${response.status})`);
        }
      } else {
        // Criação: POST /api/tecnicos
        const payload: NovoTecnico = {
          nome: nome.trim(),
          cpf: cpf.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          especialidade: especialidade.trim(),
          nrRegistro: nrRegistro.trim(),
        };

        const response = await fetch(`${apiHost}/tecnicos`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!response.ok) {
          const dadosErro = await response.json().catch(() => ({}));
          throw new Error(dadosErro.error || `Erro ao cadastrar técnico (Status ${response.status})`);
        }
      }

      navigate('/tecnicos');
    } catch (err: any) {
      setErro(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 900 }}>
      {/* Navegação / Breadcrumb */}
      <div className="mb-4">
        <Link to="/tecnicos" className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2">
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para a Lista de Técnicos
        </Link>
        <h3 className="fw-bold text-dark mb-1">
          {isEdicao ? `Editar Técnico #${id}` : 'Novo Técnico'}
        </h3>
        <p className="text-muted small mb-0">
          {isEdicao
            ? 'Atualize os dados e a especialidade do técnico'
            : 'Cadastre um novo técnico profissional para o atendimento'}
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
          <p className="text-muted small">Carregando dados do técnico...</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 p-4">
          <form onSubmit={handleSubmit}>
            {/* Seção 1: Dados Pessoais */}
            <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
              <span className="material-symbols-outlined fs-5">person</span>
              Dados Pessoais
            </h6>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nome Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nome do técnico"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  CPF * {isEdicao && <span className="badge bg-light text-muted ms-1">(Não alterável)</span>}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="000.000.000-00 ou 11 dígitos"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  maxLength={14}
                  disabled={isEdicao}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="(16) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  maxLength={20}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">E-mail *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="tecnico@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Seção 2: Dados Profissionais */}
            <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
              <span className="material-symbols-outlined fs-5">badge</span>
              Dados Profissionais
            </h6>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Especialidade Principal *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Ar Split, Multi Split, Inverter, VRF..."
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Registro Profissional (CFT / CREA / Interno) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: CFT-12345/SP"
                  value={nrRegistro}
                  onChange={(e) => setNrRegistro(e.target.value)}
                  maxLength={20}
                  required
                />
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Identificador profissional exclusivo do técnico.
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Link to="/tecnicos" className="btn btn-outline-secondary px-4">
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
                {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Técnico'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

