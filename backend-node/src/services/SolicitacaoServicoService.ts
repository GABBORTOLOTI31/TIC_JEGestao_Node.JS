import prisma from '../prisma';
import { StatusSolicitacao } from '@prisma/client';

export class SolicitacaoServicoService {
  async salvar(data: any) {
    return prisma.solicitacaoServico.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        endereco: data.endereco,
        tipoServico: data.tipoServico,
        observacoes: data.observacoes ?? null,
        dataEnvio: new Date(),
        status: StatusSolicitacao.PENDENTE,
      },
    });
  }

  async listarTodas() {
    return prisma.solicitacaoServico.findMany({ orderBy: { dataEnvio: 'desc' } });
  }

  async listarPorStatus(status: StatusSolicitacao) {
    return prisma.solicitacaoServico.findMany({ where: { status } });
  }

  async buscarPorId(id: string) {
    const s = await prisma.solicitacaoServico.findUnique({ where: { id: BigInt(id) } });
    if (!s) throw new Error(`Solicitação de serviço não encontrada. ID: ${id}`);
    return s;
  }

  async atualizarStatus(id: string, status: StatusSolicitacao) {
    await this.buscarPorId(id);
    return prisma.solicitacaoServico.update({ where: { id: BigInt(id) }, data: { status } });
  }
}
