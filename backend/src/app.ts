import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Fix para serialização do BigInt pelo JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();

app.use(cors());
app.use(express.json());

// --- Rotas públicas (sem autenticação) ---
import authRoutes from './routes/auth.routes';
import contatoRoutes from './routes/contato.routes';
import orcamentoRoutes from './routes/orcamento.routes';
import solicitacaoRoutes from './routes/solicitacao.routes';

app.use('/api/auth', authRoutes);
app.use('/api/contatos', contatoRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/solicitacoes', solicitacaoRoutes);

// --- Rotas protegidas (requerem JWT) ---
import { autenticar } from './middlewares/auth.middleware';
import clienteRoutes from './routes/cliente.routes';
import tecnicoRoutes from './routes/tecnico.routes';
import servicoRoutes from './routes/servico.routes';
import equipamentoRoutes from './routes/equipamento.routes';
import materialRoutes from './routes/material.routes';
import agendamentoRoutes from './routes/agendamento.routes';
import ordemServicoRoutes from './routes/ordemservico.routes';

app.use('/api/clientes', autenticar, clienteRoutes);
app.use('/api/tecnicos', autenticar, tecnicoRoutes);
app.use('/api/servicos', autenticar, servicoRoutes);
app.use('/api/equipamentos', autenticar, equipamentoRoutes);
app.use('/api/materiais', autenticar, materialRoutes);
app.use('/api/agendamentos', autenticar, agendamentoRoutes);
app.use('/api/ordens-servico', autenticar, ordemServicoRoutes);

export default app;
