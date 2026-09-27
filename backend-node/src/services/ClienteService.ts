import prisma from '../prisma';

function mapCliente(c: any) {
  return {
    id: c.id.toString(),
    nome: c.pessoa.nome,
    cpf: c.pessoa.cpf,
    telefone: c.pessoa.telefone,
    email: c.pessoa.email,
    dataCadastro: c.dataCadastro,
    endereco: c.endereco,
  };
}

const INCLUDE = { pessoa: true };

export class ClienteService {
  async listarTodos() {
    const todos = await prisma.cliente.findMany({ include: INCLUDE });
    return todos.map(mapCliente);
  }

  async buscarPorId(id: string) {
    const c = await prisma.cliente.findUnique({ where: { id: BigInt(id) }, include: INCLUDE });
    if (!c) throw new Error(`Cliente não encontrado. ID: ${id}`);
    return mapCliente(c);
  }

  async buscarPorNome(nome: string) {
    const todos = await prisma.cliente.findMany({
      where: { pessoa: { nome: { contains: nome, mode: 'insensitive' } } },
      include: INCLUDE,
    });
    return todos.map(mapCliente);
  }

  async salvar(data: any) {
    const existsCpf = await prisma.pessoa.findUnique({ where: { cpf: data.cpf } });
    if (existsCpf) throw new Error(`Já existe um cliente cadastrado com o CPF: ${data.cpf}`);
    const existsEmail = await prisma.pessoa.findUnique({ where: { email: data.email } });
    if (existsEmail) throw new Error(`Já existe um cliente cadastrado com o e-mail: ${data.email}`);

    const c = await prisma.pessoa.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        cliente: {
          create: {
            dataCadastro: new Date(data.dataCadastro),
            endereco: data.endereco,
          },
        },
      },
      include: { cliente: true },
    });
    return mapCliente({ ...c.cliente, pessoa: c });
  }

  async atualizar(id: string, data: any) {
    await this.buscarPorId(id);
    const bid = BigInt(id);
    await prisma.pessoa.update({
      where: { id: bid },
      data: { nome: data.nome, telefone: data.telefone, email: data.email },
    });
    await prisma.cliente.update({
      where: { id: bid },
      data: {
        endereco: data.endereco,
        dataCadastro: data.dataCadastro ? new Date(data.dataCadastro) : undefined,
      },
    });
    return this.buscarPorId(id);
  }

  async atualizarParcial(id: string, data: any) {
    return this.atualizar(id, data);
  }

  async deletar(id: string) {
    await this.buscarPorId(id);
    await prisma.pessoa.delete({ where: { id: BigInt(id) } });
  }
}
