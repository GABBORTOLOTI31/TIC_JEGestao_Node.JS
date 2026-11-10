import { NavLink } from 'react-router';
import type { UsuarioLogado } from '../types/Auth';

// Interface das propriedades recebidas pelo componente de navegação
type NavbarProps = {
  usuario: UsuarioLogado | null;
  onLogout: () => void;
};

/**
 * Componente de Navegação (Navbar / Sidebar)
 * No desktop (telas >= 768px), comporta-se como a barra lateral fixa (sidebar de 260px)
 * inspirada no protótipo Google Stitch, usando as cores da marca JE Gestão (#003298).
 * No mobile, adapta-se para uma barra superior responsiva com classes do Bootstrap 5.
 */
export function Navbar({ usuario, onLogout }: NavbarProps) {
  return (
    <>
      {/* Sidebar Fixa para Desktop (largura de 260px via classe customizada .je-sidebar) */}
      <aside className="je-sidebar p-3 d-none d-md-flex flex-column">
        {/* Logotipo e Identificação da Marca */}
        <div className="d-flex align-items-center gap-2 mb-4 px-2">
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center p-2 text-primary shadow-sm" style={{ width: 44, height: 44 }}>
            <span className="material-symbols-outlined fs-4" style={{ fontVariationSettings: "'FILL' 1" }}>
              ac_unit
            </span>
          </div>
          <div>
            <h6 className="mb-0 text-white fw-bold">JE Gestão</h6>
            <small className="text-white-50" style={{ fontSize: '0.75rem' }}>Climatização</small>
          </div>
        </div>

        {/* Links de Navegação com react-router (NavLink) */}
        <nav className="nav flex-column gap-1 flex-grow-1">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">dashboard</span>
            Dashboard
          </NavLink>

          <NavLink to="/agendamentos/novo" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">calendar_month</span>
            Novo Agendamento
          </NavLink>

          <NavLink to="/ordens-servico/nova" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">assignment</span>
            Nova OS
          </NavLink>

          <NavLink to="/clientes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">group</span>
            Clientes
          </NavLink>

          {/* Grupo Cadastros de Apoio (Fase 7A) */}
          <div className="pt-2 pb-1 px-3 text-uppercase text-white-50 fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
            Cadastros
          </div>

          <NavLink to="/tecnicos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">badge</span>
            Técnicos
          </NavLink>

          <NavLink to="/servicos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">handyman</span>
            Serviços
          </NavLink>

          <NavLink to="/materiais" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">inventory_2</span>
            Materiais
          </NavLink>

          <div className="border-top border-white border-opacity-10 my-2"></div>

          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined fs-5">public</span>
            Site Público (Home)
          </NavLink>
        </nav>

        {/* Rodapé da Sidebar: Usuário logado e botão de Logout */}
        {usuario && (
          <div className="pt-3 border-top border-white border-opacity-10 mt-auto">
            <div className="px-2 mb-2">
              <span className="badge bg-light text-primary text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>
                {usuario.perfil}
              </span>
              <p className="text-white small text-truncate mb-0" title={usuario.email}>
                {usuario.email}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
            >
              <span className="material-symbols-outlined fs-6">logout</span>
              Sair
            </button>
          </div>
        )}
      </aside>

      {/* Barra de Navegação Superior (visível apenas em telas menores / mobile) */}
      <nav className="navbar navbar-dark bg-primary d-md-none sticky-top px-3 shadow-sm">
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2 m-0">
            <span className="material-symbols-outlined">ac_unit</span>
            <span className="fw-bold fs-6">JE Gestão</span>
          </NavLink>
          {usuario ? (
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark">{usuario.perfil}</span>
              <button onClick={onLogout} className="btn btn-outline-light btn-sm p-1">
                <span className="material-symbols-outlined fs-6">logout</span>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-light btn-sm">
              Entrar
            </NavLink>
          )}
        </div>
      </nav>
    </>
  );
}
