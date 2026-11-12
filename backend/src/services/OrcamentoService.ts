import prisma from '../prisma';
import { StatusSolicitacao } from '@prisma/client';

export class OrcamentoService {
  async salvar(data: any) {
    return prisma.orcamento.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        tipoServico: data.tipoServico,
        descricao: data.descricao ?? null,
        dataEnvio: new Date(),
        status: StatusSolicitacao.PENDENTE,
      },
    });
  }

  async listarTodos() {
    return prisma.orcamento.findMany({ orderBy: { dataEnvio: 'desc' } });
  }

  async listarPorStatus(status: StatusSolicitacao) {
    return prisma.orcamento.findMany({ where: { status } });
  }

  async buscarPorId(id: string) {
    const o = await prisma.orcamento.findUnique({ where: { id: BigInt(id) } });
    if (!o) throw new Error(`Orçamento não encontrado. ID: ${id}`);
    return o;
  }

  async atualizarStatus(id: string, status: StatusSolicitacao) {
    await this.buscarPorId(id);
    return prisma.orcamento.update({ where: { id: BigInt(id) }, data: { status } });
  }
}
