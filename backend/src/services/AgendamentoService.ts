import prisma from '../prisma';
import { StatusAgendamento } from '@prisma/client';
import { TecnicoService } from './TecnicoService';
import { ClienteService } from './ClienteService';
import { ServicoService } from './ServicoService';

const tecnicoService = new TecnicoService();
const clienteService = new ClienteService();
const servicoService = new ServicoService();

const INCLUDE = {
  cliente: { include: { pessoa: true } },
  tecnico: { include: { pessoa: true } },
  servico: true,
};

function mapAgendamento(a: any) {
  return {
    id: a.id.toString(),
    cliente: a.cliente ? { id: a.cliente.id.toString(), nome: a.cliente.pessoa?.nome } : null,
    tecnico: a.tecnico ? { id: a.tecnico.id.toString(), nome: a.tecnico.pessoa?.nome } : null,
    servico: a.servico ? { id: a.servico.id.toString(), nome: a.servico.nome, duracaoEstimada: a.servico.duracaoEstimada } : null,
    dataHoraMarcada: a.dataHoraMarcada,
    observacoes: a.observacoes,
    status: a.status,
  };
}

export class AgendamentoService {
  async listarTodos() {
    const todos = await prisma.agendamento.findMany({ include: INCLUDE });
    return todos.map(mapAgendamento);
  }

  async buscarPorId(id: string) {
    const a = await prisma.agendamento.findUnique({ where: { id: BigInt(id) }, include: INCLUDE });
    if (!a) throw new Error(`Agendamento não encontrado. ID: ${id}`);
    return mapAgendamento(a);
  }

  async salvar(data: any) {
    // Valida existência das entidades relacionadas
    await clienteService.buscarPorId(String(data.clienteId));
    await tecnicoService.buscarPorId(String(data.tecnicoId));
    const servico = await servicoService.buscarPorId(String(data.servicoId));

    const dataHora = new Date(data.dataHoraMarcada);
    await this.validarConflitoDeHorario(null, BigInt(data.tecnicoId), dataHora, servico.duracaoEstimada);

    const a = await prisma.agendamento.create({
      data: {
        cliente_id: BigInt(data.clienteId),
        tecnico_id: BigInt(data.tecnicoId),
        servico_id: BigInt(data.servicoId),
        dataHoraMarcada: dataHora,
        observacoes: data.observacoes ?? null,
        status: StatusAgendamento.PENDENTE,
      },
      include: INCLUDE,
    });
    return mapAgendamento(a);
  }

  async atualizar(id: string, data: any) {
    const existente = await prisma.agendamento.findUnique({ where: { id: BigInt(id) }, include: { servico: true } });
    if (!existente) throw new Error(`Agendamento não encontrado. ID: ${id}`);

    await clienteService.buscarPorId(String(data.clienteId));
    await tecnicoService.buscarPorId(String(data.tecnicoId));
    const servico = await servicoService.buscarPorId(String(data.servicoId));

    const novaData = new Date(data.dataHoraMarcada);
    const dataMudou = existente.dataHoraMarcada.getTime() !== novaData.getTime();
    const tecnicoMudou = existente.tecnico_id !== BigInt(data.tecnicoId);

    if (dataMudou || tecnicoMudou) {
      await this.validarConflitoDeHorario(BigInt(id), BigInt(data.tecnicoId), novaData, servico.duracaoEstimada);
    }

    const a = await prisma.agendamento.update({
      where: { id: BigInt(id) },
      data: {
        cliente_id: BigInt(data.clienteId),
        tecnico_id: BigInt(data.tecnicoId),
        servico_id: BigInt(data.servicoId),
        dataHoraMarcada: novaData,
        observacoes: data.observacoes ?? null,
      },
      include: INCLUDE,
    });
    return mapAgendamento(a);
  }

  async atualizarStatus(id: string, status: StatusAgendamento) {
    const a = await prisma.agendamento.findUnique({ where: { id: BigInt(id) } });
    if (!a) throw new Error(`Agendamento não encontrado. ID: ${id}`);
    const updated = await prisma.agendamento.update({
      where: { id: BigInt(id) },
      data: { status },
      include: INCLUDE,
    });
    return mapAgendamento(updated);
  }

  async deletar(id: string) {
    await this.buscarPorId(id);
    await prisma.agendamento.delete({ where: { id: BigInt(id) } });
  }

  // Lógica fiel ao AgendamentoService.java - validação de conflito de horário por intervalo
  private async validarConflitoDeHorario(
    idAtual: bigint | null,
    tecnicoId: bigint,
    inicio: Date,
    duracaoEstimada: number
  ) {
    const duracao = duracaoEstimada ?? 60;
    const fim = new Date(inicio.getTime() + duracao * 60000);

    const inicioDia = new Date(inicio);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(inicio);
    fimDia.setHours(23, 59, 59, 999);

    const agendamentosDoDia = await prisma.agendamento.findMany({
      where: {
        tecnico_id: tecnicoId,
        dataHoraMarcada: { gte: inicioDia, lte: fimDia },
      },
      include: { servico: true },
    });

    for (const existente of agendamentosDoDia) {
      if (idAtual && existente.id === idAtual) continue; // Ignora o próprio ao atualizar
      if (
        existente.status === StatusAgendamento.CANCELADO ||
        existente.status === StatusAgendamento.CONCLUIDO
      ) continue;

      const duracaoExistente = existente.servico?.duracaoEstimada ?? 60;
      const inicioExistente = existente.dataHoraMarcada;
      const fimExistente = new Date(inicioExistente.getTime() + duracaoExistente * 60000);

      if (inicio < fimExistente && fim > inicioExistente) {
        const hi = `${inicioExistente.getHours().toString().padStart(2,'0')}:${inicioExistente.getMinutes().toString().padStart(2,'0')}`;
        const hf = `${fimExistente.getHours().toString().padStart(2,'0')}:${fimExistente.getMinutes().toString().padStart(2,'0')}`;
        throw new Error(`Conflito de horário! O técnico já possui um agendamento das ${hi} às ${hf}.`);
      }
    }
  }
}
