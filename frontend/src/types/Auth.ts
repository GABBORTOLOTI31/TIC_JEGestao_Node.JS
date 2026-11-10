/**
 * Tipos TypeScript para autenticação e controle de sessão do operador
 */

export type LoginPayload = {
  email: string;
  senha: string;
};

export type LoginResponse = {
  token: string;
};

export type PerfilUsuario = 'ADMIN' | 'TECNICO' | 'ATENDENTE';

export type UsuarioLogado = {
  email: string;
  perfil: PerfilUsuario;
};
