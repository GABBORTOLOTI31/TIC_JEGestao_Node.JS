import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import type { Cliente, NovoCliente } from '../types/Cliente';

type ClienteFormProps = {
  onLogout: () => void;
};

/******
 * Componente de Formulário de Cliente (ClienteForm)
 * Reaproveitado para criação (/clientes/novo) e edição (/clientes/:id/editar).
 * 
 * Regras e Limitações do Backend:
 * - O banco de dados armazena o endereço em uma única coluna 'endereco' (String) na tabela 'clientes'.
 *   No cadastro, os campos fracionados (CEP, rua, número, bairro, cidade, UF) são concatenados antes do envio.
 *   Na edição, o endereço é exibido e editável como texto único — ClienteService.atualizar() chama
 *   prisma.cliente.update({ data: { endereco: data.endereco } }), portanto o campo É persistido pelo PUT.
 * - Os campos PF/PJ e Observações foram removidos pois o backend não os armazena.
 * - O CPF não é editável na atualização (o serviço do backend atualiza apenas nome, telefone e email em 'pessoas').
 */
export function ClienteForm({ onLogout }: ClienteFormProps) {
  const { id } = useParams<{ id: string }>();
  const isEdicao = Boolean(id);

  // Estados dos campos do formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  // Campos fracionados de endereço para novo cadastro
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  // Endereço completo utilizado na edição (exibido como campo único editável)
  // O backend persiste o endereco via prisma.cliente.update() no ClienteService.atualizar()
  const [enderecoCompletoEdicao, setEnderecoCompletoEdicao] = useState('');

  // Estados de controle
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  /**
   * Trata respostas HTTP 401 (Não Autorizado / Token Expirado)
   */
  function tratarNaoAutorizado() {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  }

  /**
   * Se for edição, carrega os dados atuais do cliente
   * Endpoint: GET /api/clientes/:id
   */
  useEffect(() => {
    if (!isEdicao || !id) return;

    async function carregarCliente() {
      setCarregando(true);
      setErro(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(`${apiHost}/clientes/${id}`, { headers });

        if (response.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!response.ok) {
          const dadosErro = await response.json().catch(() => ({}));
          throw new Error(dadosErro.error || `Cliente não encontrado (Status ${response.status})`);
        }

        const data: Cliente = await response.json();
        setNome(data.nome);
        setCpf(data.cpf);
        setTelefone(data.telefone);
        setEmail(data.email);
        setEnderecoCompletoEdicao(data.endereco);
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados do cliente para edição.');
      } finally {
        setCarregando(false);
      }
    }

    carregarCliente();
  }, [id, isEdicao]);

  /**
   * Validação e submissão do formulário
   * Criação: POST /api/clientes
   * Edição: PUT /api/clientes/:id
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    // Validação de CPF (11 dígitos numéricos limpos ou 14 formatados)
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!isEdicao && cpfLimpo.length !== 11 && cpf.trim().length !== 14) {
      setErro('O CPF informado deve conter 11 dígitos numéricos (ou 14 caracteres no formato 000.000.000-00).');
      return;
    }

    // Determina o endereço final que será enviado
    let enderecoFinal = '';

    if (isEdicao) {
      // Na edição, utiliza o campo de texto único editável
      enderecoFinal = enderecoCompletoEdicao.trim();
    } else {
      // No cadastro, concatena os campos fracionados em uma única string
      if (!rua.trim() || !numero.trim() || !cidade.trim() || !uf.trim()) {
        setErro('Por favor, preencha rua, número, cidade e UF do endereço.');
        return;
      }
      const cepFormatado = cep.trim() ? ` - CEP: ${cep.trim()}` : '';
      const bairroFormatado = bairro.trim() ? `, ${bairro.trim()}` : '';
      enderecoFinal = `${rua.trim()}, ${numero.trim()}${bairroFormatado}, ${cidade.trim()}/${uf.trim().toUpperCase()}${cepFormatado}`;
    }

    if (!enderecoFinal) {
      setErro('O endereço do cliente é obrigatório.');
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
        // Atualização: PUT /api/clientes/:id
        const payload = {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          endereco: enderecoFinal,
        };

        const response = await fetch(`${apiHost}/clientes/${id}`, {
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
          throw new Error(dadosErro.error || `Erro ao atualizar cliente (Status ${response.status})`);
        }
      } else {
        // Criação: POST /api/clientes
        const payload: NovoCliente = {
          nome: nome.trim(),
          cpf: cpf.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          dataCadastro: new Date().toISOString(),
          endereco: enderecoFinal,
        };

        const response = await fetch(`${apiHost}/clientes`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          tratarNaoAutorizado();
          return;
        }

        if (!response.ok) {
          // Captura a mensagem de erro específica devolvida pelo backend (ex.: CPF ou e-mail duplicado)
          const dadosErro = await response.json().catch(() => ({}));
          throw new Error(dadosErro.error || `Erro ao cadastrar cliente (Status ${response.status})`);
        }
      }

      // Redireciona de volta para a listagem com sucesso
      navigate('/clientes');
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
        <Link to="/clientes" className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1 mb-2">
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          Voltar para a Lista de Clientes
        </Link>
        <h3 className="fw-bold text-dark mb-1">
          {isEdicao ? `Editar Cliente #${id}` : 'Novo Cliente'}
        </h3>
        <p className="text-muted small mb-0">
          {isEdicao
            ? 'Atualize os dados do cliente abaixo'
            : 'Preencha as informações cadastrais para registrar um novo cliente'}
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
          <p className="text-muted small">Carregando dados do cliente...</p>
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
                  placeholder="Nome do cliente"
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
                  placeholder="cliente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Seção 2: Endereço */}
            <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
              <span className="material-symbols-outlined fs-5">location_on</span>
              Endereço do Cliente
            </h6>

            {/* Comentário explicativo sobre o campo único de endereço */}
            <div className="alert alert-light border small text-muted py-2 mb-3">
              <span className="fw-semibold text-dark">Nota sobre o Banco de Dados:</span>{' '}
              {isEdicao
                ? 'O backend armazena o endereço em campo único. Edite o texto completo abaixo — o PUT persiste o campo endereco via prisma.cliente.update().'
                : 'O backend armazena o endereço em campo único. Os campos abaixo serão concatenados automaticamente no envio.'}
            </div>

            {isEdicao ? (
              // Na edição: campo de texto único e editável
              // O ClienteService.atualizar() chama prisma.cliente.update({ data: { endereco: data.endereco } })
              // portanto o endereço É persistido pelo PUT /api/clientes/:id
              <div className="mb-4">
                <label className="form-label small fw-semibold">Endereço Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  value={enderecoCompletoEdicao}
                  onChange={(e) => setEnderecoCompletoEdicao(e.target.value)}
                  placeholder="Ex: Av. Brasil, 1234, Centro, Franca/SP - CEP: 14400-000"
                  required
                />
                <div className="form-text text-muted">
                  Edite o endereço completo no campo acima. O banco armazena o endereço em campo único.
                </div>
              </div>
            ) : (
              // No cadastro: campos fracionados que serão concatenados no submit
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">CEP</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="14400-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      maxLength={10}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Rua / Logradouro *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rua, Avenida..."
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      required={!isEdicao}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">Número *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="123"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      required={!isEdicao}
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold">Bairro</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Bairro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold">Cidade *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      required={!isEdicao}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">UF *</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="SP"
                      maxLength={2}
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      required={!isEdicao}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Link to="/clientes" className="btn btn-outline-secondary px-4">
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
                {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
