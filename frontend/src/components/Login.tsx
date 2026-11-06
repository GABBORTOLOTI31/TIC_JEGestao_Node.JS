import { useState, type FormEvent } from 'react';
import { useNavigate, NavLink } from 'react-router';
import type { LoginPayload, LoginResponse } from '../types/Auth';

type LoginProps = {
  onLoginSuccess: (token: string) => void;
};

/**
 * Componente de Autenticação (Login)
 * Realiza o envio de email e senha para o backend (POST /api/auth/login).
 * Utiliza fetch nativo com async/await e try/catch conforme o padrão ensinado em PP2.
 */
export function Login({ onLoginSuccess }: LoginProps) {
  // Estados para capturar os dados do formulário controlado
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Hook do react-router para navegação programática
  const navigate = useNavigate();
  const apiHost = import.meta.env.VITE_API_BASE;

  /**
   * Função executada no envio do formulário de login
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const payload: LoginPayload = {
      email,
      senha,
    };

    try {
      // Chamada HTTP via fetch nativo sem o uso de bibliotecas externas como axios
      const response = await fetch(`${apiHost}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Se a resposta for diferente de 2xx, trata o erro
      if (!response.ok) {
        const dadosErro = await response.json().catch(() => ({}));
        throw new Error(dadosErro.error || `Credenciais inválidas (Status HTTP: ${response.status})`);
      }

      // Converte o corpo da resposta em JSON tipado
      const data: LoginResponse = await response.json();
      
      // Salva o token no localStorage e atualiza o estado do App.tsx
      onLoginSuccess(data.token);

      // Redireciona o usuário para o Dashboard administrativo
      navigate('/dashboard');
    } catch (err: any) {
      setErro(err.message || 'Erro ao conectar ao servidor backend.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '85vh' }}>
      <div className="card shadow-sm border-0 p-4 rounded-4" style={{ maxWidth: 420, width: '100%' }}>
        {/* Cabeçalho do Card de Login */}
        <div className="text-center mb-4">
          <div className="bg-primary text-white rounded-circle d-inline-flex p-3 mb-2 shadow-sm">
            <span className="material-symbols-outlined fs-2">ac_unit</span>
          </div>
          <h4 className="fw-bold text-dark mb-1">JE Gestão</h4>
          <p className="text-muted small">Acesso Restrito para Operadores e Técnicos</p>
        </div>

        {/* Mensagem de Erro (Alerta Bootstrap) */}
        {erro && (
          <div className="alert alert-danger py-2 small d-flex align-items-center gap-2" role="alert">
            <span className="material-symbols-outlined fs-5">warning</span>
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário de Autenticação */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">E-mail de Acesso</label>
            <input
              type="email"
              className="form-control"
              placeholder="exemplo@jegestao.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Senha</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3 shadow-sm"
            disabled={carregando}
          >
            {carregando ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <span className="material-symbols-outlined fs-5">login</span>
            )}
            {carregando ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="text-center pt-2 border-top">
          <NavLink to="/" className="text-decoration-none small text-muted d-flex align-items-center justify-content-center gap-1">
            <span className="material-symbols-outlined fs-6">arrow_back</span>
            Voltar para o site público
          </NavLink>
        </div>
      </div>
    </div>
  );
}
