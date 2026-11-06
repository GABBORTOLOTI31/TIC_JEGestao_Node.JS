import { useState, type FormEvent } from 'react';
import { NavLink } from 'react-router';
import type { NovoOrcamento } from '../types/Orcamento';
import type { NovoContato } from '../types/Contato';

/**
 * Componente da Página Inicial (Landing Page Pública)
 * Apresenta a empresa JE Ar-Condicionado, serviços prestados, etapas de atendimento,
 * canais de contato e formulários para solicitação de orçamento e envio de mensagens.
 * 
 * Integração direta com os endpoints públicos do backend:
 * - POST /api/orcamentos (solicitação de orçamento)
 * - POST /api/contatos (envio de mensagem em Fale Conosco)
 */
export function Home() {
  const apiHost = import.meta.env.VITE_API_BASE;

  // --- Estados do Formulário de Orçamento ---
  const [nomeOrcamento, setNomeOrcamento] = useState('');
  const [telefoneOrcamento, setTelefoneOrcamento] = useState('');
  const [emailOrcamento, setEmailOrcamento] = useState('');
  const [tipoServicoOrcamento, setTipoServicoOrcamento] = useState('Manutenção');
  const [descricaoOrcamento, setDescricaoOrcamento] = useState('');
  const [enviandoOrcamento, setEnviandoOrcamento] = useState(false);
  const [sucessoOrcamento, setSucessoOrcamento] = useState<string | null>(null);
  const [erroOrcamento, setErroOrcamento] = useState<string | null>(null);

  // --- Estados do Formulário de Contato / Fale Conosco ---
  const [nomeContato, setNomeContato] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [mensagemContato, setMensagemContato] = useState('');
  const [enviandoContato, setEnviandoContato] = useState(false);
  const [sucessoContato, setSucessoContato] = useState<string | null>(null);
  const [erroContato, setErroContato] = useState<string | null>(null);

  /**
   * Envia os dados de solicitação de orçamento para a API
   * Endpoint: POST /api/orcamentos
   */
  async function handleEnviarOrcamento(e: FormEvent) {
    e.preventDefault();
    setSucessoOrcamento(null);
    setErroOrcamento(null);
    setEnviandoOrcamento(true);

    const payload: NovoOrcamento = {
      nome: nomeOrcamento,
      telefone: telefoneOrcamento,
      email: emailOrcamento,
      tipoServico: tipoServicoOrcamento,
      descricao: descricaoOrcamento || undefined,
    };

    try {
      const response = await fetch(`${apiHost}/orcamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar solicitação (Status HTTP: ${response.status})`);
      }

      setSucessoOrcamento('Solicitação de orçamento enviada com sucesso! Entraremos em contato em breve.');
      // Limpa os campos do formulário
      setNomeOrcamento('');
      setTelefoneOrcamento('');
      setEmailOrcamento('');
      setDescricaoOrcamento('');
    } catch (err: any) {
      setErroOrcamento(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setEnviandoOrcamento(false);
    }
  }

  /**
   * Envia a mensagem do Fale Conosco para a API
   * Endpoint: POST /api/contatos
   */
  async function handleEnviarContato(e: FormEvent) {
    e.preventDefault();
    setSucessoContato(null);
    setErroContato(null);
    setEnviandoContato(true);

    const payload: NovoContato = {
      nome: nomeContato,
      telefone: telefoneContato,
      mensagem: mensagemContato,
    };

    try {
      const response = await fetch(`${apiHost}/contatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem (Status HTTP: ${response.status})`);
      }

      setSucessoContato('Mensagem enviada com sucesso! Responderemos o mais rápido possível.');
      // Limpa os campos do formulário
      setNomeContato('');
      setTelefoneContato('');
      setMensagemContato('');
    } catch (err: any) {
      setErroContato(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setEnviandoContato(false);
    }
  }

  return (
    <div className="bg-light">
      {/* Barra de Navegação Pública Superior */}
      <header className="bg-white border-bottom sticky-top py-3 shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded p-2 d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
              <span className="material-symbols-outlined fs-5">ac_unit</span>
            </div>
            <span className="fw-bold fs-5 text-primary mb-0">JE AR-CONDICIONADO</span>
          </div>

          <nav className="d-none d-md-flex gap-4">
            <a href="#inicio" className="text-decoration-none text-dark fw-semibold">Início</a>
            <a href="#servicos" className="text-decoration-none text-muted">Serviços</a>
            <a href="#como-funciona" className="text-decoration-none text-muted">Como Funciona</a>
            <a href="#orcamento" className="text-decoration-none text-muted">Orçamento</a>
            <a href="#contato" className="text-decoration-none text-muted">Contato</a>
          </nav>

          <div className="d-flex gap-2">
            <a href="#orcamento" className="btn btn-primary btn-sm px-3 fw-semibold d-none d-sm-inline-block">
              Solicitar Orçamento
            </a>
            <NavLink to="/login" className="btn btn-outline-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1">
              <span className="material-symbols-outlined fs-6">lock</span>
              Entrar
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="py-5" style={{ background: 'linear-gradient(180deg, #FAF8FF 0%, #FFFFFF 100%)' }}>
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
                Gestão e Manutenção em Climatização
              </span>
              <h1 className="display-5 fw-bold text-dark mb-3">
                Soluções completas em ar-condicionado para seu <span className="text-primary">conforto e bem-estar</span>.
              </h1>
              <p className="lead text-muted mb-4">
                Instalação, manutenção preventiva e higienização com qualidade e confiança que você merece. Equipe técnica especializada para garantir o clima perfeito em seu ambiente.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <a href="#orcamento" className="btn btn-primary btn-lg px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined">request_quote</span>
                  Solicitar Orçamento
                </a>
                <a href="#contato" className="btn btn-outline-primary btn-lg px-4 fw-semibold d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined">chat</span>
                  Fale Conosco
                </a>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card shadow-sm border-0 p-4 text-center bg-white rounded-4">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-4 mx-auto mb-3">
                  <span className="material-symbols-outlined display-3" style={{ fontVariationSettings: "'FILL' 1" }}>
                    ac_unit
                  </span>
                </div>
                <h4 className="fw-bold text-dark mb-1">JE Ar-Condicionado</h4>
                <p className="text-muted small mb-4">Eficiência, economia e ar puro em todos os momentos.</p>
                <div className="row g-2 text-start">
                  <div className="col-6">
                    <div className="p-2 border rounded bg-light">
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Atendimento</small>
                      <strong className="text-primary small">Comercial e Residencial</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded bg-light">
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Garantia</small>
                      <strong className="text-primary small">Peças e Serviços</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vitrine de Serviços */}
      <section id="servicos" className="py-5 bg-white border-top border-bottom">
        <div className="container py-3">
          <div className="text-center mb-5">
            <span className="text-primary fw-semibold text-uppercase small tracking-wide">Nossos Serviços</span>
            <h2 className="fw-bold text-dark mt-1">Soluções Especializadas</h2>
            <p className="text-muted">Serviços executados por técnicos certificados com as melhores práticas do mercado.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center kpi-card">
                <div className="bg-primary text-white rounded-3 p-3 d-inline-flex mx-auto mb-3 shadow-sm">
                  <span className="material-symbols-outlined fs-2">build_circle</span>
                </div>
                <h5 className="fw-bold text-dark mb-2">Instalação</h5>
                <p className="text-muted small mb-0">Instalação segura e dimensionada de aparelhos split, inverter e centrais de ar.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center kpi-card">
                <div className="bg-primary text-white rounded-3 p-3 d-inline-flex mx-auto mb-3 shadow-sm">
                  <span className="material-symbols-outlined fs-2">settings_heart</span>
                </div>
                <h5 className="fw-bold text-dark mb-2">Manutenção</h5>
                <p className="text-muted small mb-0">Revisão preventiva, teste de pressão de gás e reparos elétricos e mecânicos.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center kpi-card">
                <div className="bg-primary text-white rounded-3 p-3 d-inline-flex mx-auto mb-3 shadow-sm">
                  <span className="material-symbols-outlined fs-2">cleaning_services</span>
                </div>
                <h5 className="fw-bold text-dark mb-2">Higienização</h5>
                <p className="text-muted small mb-0">Limpeza profunda com bactericida para remoção de fungos, ácaros e poeira.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center kpi-card">
                <div className="bg-primary text-white rounded-3 p-3 d-inline-flex mx-auto mb-3 shadow-sm">
                  <span className="material-symbols-outlined fs-2">speed</span>
                </div>
                <h5 className="fw-bold text-dark mb-2">Atendimento Rápido</h5>
                <p className="text-muted small mb-0">Agilidade no diagnóstico e cumprimento rigoroso dos prazos combinados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-5 bg-light">
        <div className="container py-3">
          <div className="text-center mb-5">
            <span className="text-primary fw-semibold text-uppercase small tracking-wide">Passo a Passo</span>
            <h2 className="fw-bold text-dark mt-1">Como Funciona?</h2>
            <p className="text-muted">Simples, prático e transparente do início à entrega do serviço.</p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3 shadow-sm" style={{ width: 60, height: 60 }}>
                  1
                </div>
                <h5 className="fw-bold text-dark">Solicite um Orçamento</h5>
                <p className="text-muted small">Preencha o formulário online ou nos contate diretamente pelo WhatsApp.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3 shadow-sm" style={{ width: 60, height: 60 }}>
                  2
                </div>
                <h5 className="fw-bold text-dark">Agende o Serviço</h5>
                <p className="text-muted small">Defina o melhor dia e horário para a visita do técnico responsável.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3 shadow-sm" style={{ width: 60, height: 60 }}>
                  3
                </div>
                <h5 className="fw-bold text-dark">Serviço Realizado</h5>
                <p className="text-muted small">Execução com materiais de qualidade, checklist técnico e garantia.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção com Formulário de Orçamento e Fale Conosco */}
      <section id="orcamento" className="py-5 bg-white border-top">
        <div className="container py-3">
          <div className="row g-5">
            {/* Formulário de Orçamento (POST /api/orcamentos) */}
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 p-4 rounded-4">
                <h3 className="fw-bold text-dark mb-2">Solicitar Orçamento Online</h3>
                <p className="text-muted small mb-4">
                  Envie os detalhes da sua necessidade e receba uma estimativa sem compromisso.
                </p>

                {sucessoOrcamento && (
                  <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert">
                    <span className="material-symbols-outlined fs-5">check_circle</span>
                    <small>{sucessoOrcamento}</small>
                  </div>
                )}

                {erroOrcamento && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                    <span className="material-symbols-outlined fs-5">error</span>
                    <small>{erroOrcamento}</small>
                  </div>
                )}

                <form onSubmit={handleEnviarOrcamento}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Nome Completo *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Seu nome"
                        value={nomeOrcamento}
                        onChange={(e) => setNomeOrcamento(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Telefone / WhatsApp *</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="(16) 99999-9999"
                        value={telefoneOrcamento}
                        onChange={(e) => setTelefoneOrcamento(e.target.value)}
                        maxLength={20}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">E-mail *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="seuemail@exemplo.com"
                        value={emailOrcamento}
                        onChange={(e) => setEmailOrcamento(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Tipo de Serviço *</label>
                      <select
                        className="form-select"
                        value={tipoServicoOrcamento}
                        onChange={(e) => setTipoServicoOrcamento(e.target.value)}
                        required
                      >
                        <option value="Instalação">Instalação de Ar-Condicionado</option>
                        <option value="Manutenção">Manutenção Preventiva / Corretiva</option>
                        <option value="Higienização">Higienização Completa</option>
                        <option value="Carga de Gás">Recarga / Verificação de Gás</option>
                        <option value="Outro">Outro Serviço</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Descrição / Detalhes (Opcional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Informe modelo do aparelho, quantidade de BTUs ou defeito observado..."
                      value={descricaoOrcamento}
                      onChange={(e) => setDescricaoOrcamento(e.target.value)}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    disabled={enviandoOrcamento}
                  >
                    {enviandoOrcamento ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    ) : (
                      <span className="material-symbols-outlined fs-5">send</span>
                    )}
                    {enviandoOrcamento ? 'Enviando Solicitação...' : 'Enviar Solicitação de Orçamento'}
                  </button>
                </form>
              </div>
            </div>

            {/* Canais de Contato e Formulário de Mensagem (POST /api/contatos) */}
            <div id="contato" className="col-lg-5">
              <div className="card shadow-sm border-0 p-4 rounded-4 mb-4">
                <h4 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined text-primary fs-4">support_agent</span>
                  Fale Conosco
                </h4>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                    <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                      <span className="material-symbols-outlined fs-5">phone</span>
                    </div>
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>WhatsApp Comercial</small>
                      <strong className="text-dark">(16) 99119-0520</strong>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                    <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                      <span className="material-symbols-outlined fs-5">engineering</span>
                    </div>
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Plantão Técnico</small>
                      <strong className="text-dark">(16) 99273-4951</strong>
                    </div>
                  </div>
                </div>

                <hr className="my-3 text-muted" />

                {/* Formulário de Mensagem Direta */}
                <h6 className="fw-bold text-dark mb-2">Envie uma Mensagem Rápida</h6>

                {sucessoContato && (
                  <div className="alert alert-success py-2 mb-2" role="alert">
                    <small>{sucessoContato}</small>
                  </div>
                )}

                {erroContato && (
                  <div className="alert alert-danger py-2 mb-2" role="alert">
                    <small>{erroContato}</small>
                  </div>
                )}

                <form onSubmit={handleEnviarContato}>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Seu nome"
                      value={nomeContato}
                      onChange={(e) => setNomeContato(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      placeholder="Seu telefone"
                      value={telefoneContato}
                      onChange={(e) => setTelefoneContato(e.target.value)}
                      maxLength={20}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Sua mensagem ou dúvida..."
                      value={mensagemContato}
                      onChange={(e) => setMensagemContato(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-outline-primary btn-sm w-100 fw-semibold"
                    disabled={enviandoContato}
                  >
                    {enviandoContato ? 'Enviando...' : 'Enviar Mensagem'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé Público */}
      <footer className="bg-dark text-white py-4 border-top">
        <div className="container text-center">
          <p className="small mb-1">© 2026 JE Gestão — Ar-Condicionado e Climatização. Todos os direitos reservados.</p>
          <small className="text-white-50">Desenvolvido como projeto acadêmico de software para gestão de serviços técnicos.</small>
        </div>
      </footer>
    </div>
  );
}
