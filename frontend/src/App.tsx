import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ClienteList } from './components/ClienteList';
import { ClienteForm } from './components/ClienteForm';
import { OrdemServicoDetalhe } from './components/OrdemServicoDetalhe';
import type { UsuarioLogado, PerfilUsuario } from './types/Auth';

/**
 * Função didática para decodificar o token JWT no frontend.
 * Estrutura do token: [cabeçalho].[payload].[assinatura]
 * A parte do meio (payload) é codificada em Base64. Utilizamos atob()
 * para decodificar a string Base64 e JSON.parse() para transformá-la em objeto.
 */
function decodificarToken(token: string | null): UsuarioLogado | null {
  if (!token) return null;
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const payloadJson = atob(partes[1]);
    const payload = JSON.parse(payloadJson);
    return {
      email: payload.email,
      perfil: payload.perfil as PerfilUsuario,
    };
  } catch (erro) {
    console.error('Falha ao decodificar token JWT:', erro);
    return null;
  }
}

export function App() {
  // Estado simples para armazenar o token JWT lido inicialmente do localStorage
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Usuário derivado diretamente do token decodificado (email e perfil)
  const usuario = decodificarToken(token);

  // Função chamada ao realizar login com sucesso
  function handleLogin(novoToken: string) {
    localStorage.setItem('token', novoToken);
    setToken(novoToken);
  }

  // Função chamada para encerrar a sessão (logout)
  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  return (
    <BrowserRouter>
      {/* Exibe a Navbar da área interna se o usuário estiver autenticado */}
      {token && <Navbar usuario={usuario} onLogout={handleLogout} />}

      {/* Conteúdo principal da aplicação com deslocamento de margem para a sidebar no Desktop */}
      <main className={token ? 'je-main-content' : ''}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLoginSuccess={handleLogin} />
              )
            }
          />

          {/* Rotas Protegidas do Dashboard e Ordens de Serviço */}
          <Route
            path="/dashboard"
            element={
              token ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/ordens-servico/:id"
            element={
              token ? (
                <OrdemServicoDetalhe onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Rotas Protegidas do Módulo de Clientes (Fase 4) */}
          <Route
            path="/clientes"
            element={
              token ? (
                <ClienteList onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clientes/novo"
            element={
              token ? (
                <ClienteForm onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clientes/:id/editar"
            element={
              token ? (
                <ClienteForm onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Rota de Agendamentos (será implementada na Fase 5) */}
          <Route
            path="/agendamentos/novo"
            element={
              token ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Rota padrão (fallback para rotas não encontradas) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
