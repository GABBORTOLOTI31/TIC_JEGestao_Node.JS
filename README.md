# 🛠️ J.E. Gestão — Sistema de Gestão de Atendimento e Serviços de Ar Condicionado

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-darkblue.svg)](https://www.prisma.io/)

O **J.E. Gestão** é uma solução desenvolvida para otimizar o fluxo de trabalho, controle operacional e gerenciamento de ordens de serviço (OS) em empresas prestadoras de serviços de **instalação, manutenção e higienização de sistemas de ar condicionado**.

---

## 📌 Funcionalidades do Sistema

### Implementadas
- 📋 **Gestão de Ordens de Serviço (OS):** Abertura de chamados com vínculo a agendamentos, transição de status guiada pela interface, checklist operacional de inspeção técnica, lançamento de materiais utilizados e impressão formatada para via do cliente.
- 👤 **Cadastro e Gestão de Clientes:** Registro de clientes com CPF único, dados de contato e endereço consolidado, busca por nome, edição de dados e exclusão que exibe a mensagem de erro retornada pelo back-end em caso de registros vinculados.
- ❄️ **Controle de Equipamentos:** Cadastro rápido de equipamentos (marca, modelo e número de série) em seção expansível no formulário de OS e seleção a partir do catálogo geral.
- 🧑‍🔧 **Gestão de Técnicos:** Cadastro de profissionais com CPF e número de registro, controle de disponibilidade operacional (ativo/inativo) e listagem filtrada para agendamentos.
- 🛠️ **Catálogo de Serviços e Materiais:** Cadastro de serviços com valor base e tempo estimado de execução; controle de materiais com preço unitário e unidade de medida.
- 📅 **Agendamento com Agenda do Dia:** Agendamento de visitas com verificação de conflitos de horário para o técnico selecionado e painel dinâmico dos atendimentos agendados para a data.
- 📊 **Dashboard Administrativo:** Indicadores diários calculados em tempo real (agendamentos de hoje no fuso local, ordens em aberto, clientes cadastrados e técnicos ativos), lista de próximos compromissos e tabela de ordens de serviço com filtros.
- 🌐 **Landing Page Pública:** Apresentação da empresa com canais diretos para envio de solicitações de orçamento e mensagens de contato.

### Planejadas
- 📑 **Listagens Completas de Agendamentos e OS:** Telas administrativas dedicadas para consulta geral e histórico completo de agendamentos (com ações de confirmar/cancelar) e ordens de serviço (atualmente resumidos no Dashboard).
- 📬 **Gestão Interna de Mensagens e Orçamentos:** Telas internas para visualização e acompanhamento de orçamentos, contatos e solicitações de serviço recebidos pelo site (atualmente os dados são gravados no banco pelos formulários públicos, mas não possuem telas de visualização no front-end).
- 🏢 **Pessoa Jurídica e Múltiplos Endereços:** Suporte a clientes com CNPJ e cadastro de múltiplos endereços e locais de atendimento.
- 📍 **Vínculo Cliente x Equipamento x Ambiente:** Mapeamento e vinculação direta de equipamentos ao cliente e aos respectivos ambientes atendidos.
- 📜 **Histórico por Equipamento:** Ficha consolidada de manutenções preventivas e corretivas executadas em cada aparelho.
- 📈 **Relatórios Gerenciais:** Emissão de relatórios analíticos operacionais e financeiros com exportação para PDF e planilhas.
- ⏱️ **Gestão de Escalas:** Controle avançado de jornada, intervalos e disponibilidade técnica.

---

## 🛠️ Tecnologias Utilizadas

### Back-end
- **Runtime:** [Node.js](https://nodejs.org/) (v18+)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (v5.6.3)
- **Framework Web:** [Express.js](https://expressjs.com/) (v4.21.0)
- **ORM:** [Prisma ORM](https://www.prisma.io/) (v5.22.0)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Autenticação:** JSON Web Token ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) v9.0.3) e [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (v3.0.3)
- **Segurança & Utilitários:** [cors](https://expressjs.com/en/resources/middleware/cors.html) (v2.8.5), [dotenv](https://github.com/motdotla/dotenv) (v16.4.5), [nodemon](https://nodemon.io/) (v3.1.7), [ts-node](https://typestrong.org/ts-node/) (v10.9.2)

### Front-end
- **Biblioteca Base:** [React](https://react.dev/) (v19.3.1)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (v7.0.2 no package.json)
- **Build Tool / Bundler:** [Vite](https://vitejs.dev/) (v8.3.5)
- **Roteamento:** [react-router](https://reactrouter.com/) (v8.5.1)
- **Estilização & UI:** [Bootstrap](https://getbootstrap.com/) (v5.3.8) e Material Symbols
- **Tipografia:** Fonte Inter via Google Fonts
- **Estilos de Impressão:** Regras `@media print` dedicadas no arquivo `src/index.css`

---

## 📁 Estrutura do Projeto

```text
./ (raiz do repositório)
├── backend-node/                 # Aplicação Back-end (API REST Express)
│   ├── prisma/
│   │   └── schema.prisma         # Definições de modelos e relacionamentos do banco
│   ├── src/
│   │   ├── controllers/          # Controladores HTTP das rotas
│   │   ├── middlewares/          # Middlewares (autenticação JWT e autorização)
│   │   ├── routes/               # Definição e registro dos endpoints da API
│   │   ├── services/             # Regras de negócio e persistência via Prisma
│   │   ├── utils/                # Utilitários (geração e validação de tokens JWT)
│   │   ├── app.ts                # Configuração do Express, middlewares e rotas
│   │   ├── prisma.ts             # Instância singleton do PrismaClient
│   │   └── server.ts             # Inicialização do servidor HTTP na porta definida
│   ├── .env.example              # Modelo das variáveis de ambiente do back-end
│   ├── package.json              # Scripts e dependências do back-end
│   └── tsconfig.json             # Configuração do compilador TypeScript
│
├── frontend/                     # Aplicação Front-end (SPA React 19 com Vite)
│   ├── public/                   # Arquivos estáticos servidos diretamente
│   ├── src/
│   │   ├── assets/               # Recursos estáticos (imagens e ícones)
│   │   ├── components/           # Componentes funcionais e telas da aplicação
│   │   │   ├── AgendamentoForm.tsx     # Formulário de agendamento e agenda do dia
│   │   │   ├── ClienteForm.tsx         # Formulário de cadastro/edição de clientes
│   │   │   ├── ClienteList.tsx         # Listagem de clientes com busca
│   │   │   ├── Dashboard.tsx           # Painel gerencial e indicadores
│   │   │   ├── Home.tsx                # Landing page pública (orçamentos e contatos)
│   │   │   ├── Login.tsx               # Tela de autenticação administrativa
│   │   │   ├── MaterialForm.tsx        # Cadastro e edição de materiais
│   │   │   ├── MaterialList.tsx        # Listagem de materiais e exclusão
│   │   │   ├── Navbar.tsx              # Sidebar desktop fixa e menu mobile
│   │   │   ├── OrdemServicoDetalhe.tsx # Visualização da OS, checklist, materiais e impressão
│   │   │   ├── OrdemServicoForm.tsx    # Abertura de OS com cadastro rápido de equipamento
│   │   │   ├── ServicoForm.tsx         # Cadastro e edição de serviços
│   │   │   ├── ServicoList.tsx         # Listagem de serviços e status
│   │   │   ├── TecnicoForm.tsx         # Cadastro e edição de técnicos
│   │   │   └── TecnicoList.tsx         # Listagem de técnicos e ativação/inativação
│   │   ├── types/                # Tipagens TypeScript espelhando as entidades da API
│   │   ├── App.css               # Estilos complementares de layout
│   │   ├── App.tsx               # Roteamento da aplicação e proteção de rotas
│   │   ├── index.css             # Tema global, variáveis (#003298) e regras @media print
│   │   ├── main.tsx              # Ponto de entrada React 19
│   │   └── vite-env.d.ts         # Tipagem das variáveis de ambiente do Vite
│   ├── .env.example              # Exemplo da variável de integração VITE_API_BASE
│   ├── index.html                # Documento HTML principal da SPA
│   ├── package.json              # Scripts e dependências do front-end
│   └── vite.config.ts            # Configuração do Vite e plugin React
│
└── README.md                     # Documentação central do repositório
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/) rodando localmente ou via container Docker
- Gerenciador de pacotes `npm`

---

### 1. Configuração e Execução do Back-end

1. Navegue até o diretório do back-end:
   ```bash
   cd backend-node
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo de variáveis de ambiente a partir do exemplo:
   ```bash
   cp .env.example .env
   ```

4. Configure o arquivo `.env` com a URL de conexão do PostgreSQL e a chave secreta do JWT:
   ```env
   DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/ordemservico_db?schema=public"
   JWT_SECRET="sua-chave-secreta-aqui-minimo-256-bits"
   PORT=3000
   ```

5. Crie e aplique a estrutura de tabelas no banco de dados via Prisma Migrate:
   ```bash
   npx prisma migrate dev --name init
   ```

6. Inicie o servidor em modo de desenvolvimento (com recarregamento automático pelo Nodemon):
   ```bash
   npm run dev
   ```

   A API estará disponível em: `http://localhost:3000/api`

---

### 2. Configuração e Execução do Front-end

1. Abra um novo terminal e navegue até a pasta do front-end:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo `.env.local` a partir do modelo `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Certifique-se de que a variável `VITE_API_BASE` no `.env.local` aponta para o back-end em execução:
   ```env
   VITE_API_BASE=http://localhost:3000/api
   ```

5. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```

6. Acesse a aplicação no navegador pelo endereço informado (geralmente `http://localhost:5173`).

---

## 🔑 Primeiro Acesso: Criação do Usuário Inicial

Como a aplicação ainda não possui interface gráfica para criação de novos operadores administrativos, o primeiro usuário com permissão de acesso deve ser criado enviando uma requisição HTTP para a rota de registro.

Envie um `POST` para `http://localhost:3000/api/auth/registrar`:

**Cabeçalhos:**
```http
Content-Type: application/json
```

**Corpo (Body JSON):**
```json
{
  "nome": "Administrador do Sistema",
  "email": "admin@jegestao.com.br",
  "senha": "senhaSegura123",
  "perfil": "ADMIN"
}
```

*Campos aceitos:*
- `nome` *(string, obrigatório)*: Nome completo do usuário.
- `email` *(string, obrigatório)*: E-mail que será utilizado no login.
- `senha` *(string, obrigatório)*: Senha em texto puro (o back-end armazena o hash criptografado via bcrypt).
- `perfil` *(string, opcional)*: Valores aceitos no enum do Prisma: `ADMIN`, `TECNICO` ou `ATENDENTE` (padrão: `ATENDENTE` caso não informado).

Após a criação, utilize o e-mail e a senha cadastrados para acessar a tela `/login`.

---

## 🔐 Fluxo de Autenticação JWT

A segurança de acesso ao painel gerencial opera com JSON Web Token (JWT):
1. **Autenticação:** O usuário insere e-mail e senha na tela `/login`, disparando `POST /auth/login`.
2. **Armazenamento do Token:** Ao validar as credenciais, o back-end retorna um token assinado, armazenado pelo front-end no `localStorage` sob a chave `token`.
3. **Identificação do Usuário:** O front-end decodifica o payload Base64 do JWT para extrair e exibir o e-mail e perfil do operador na barra de navegação (`Navbar.tsx`).
4. **Envio nas Requisições:** Em todas as requisições para rotas protegidas da API, o front-end anexa o cabeçalho:
   ```http
   Authorization: Bearer <token>
   ```
5. **Tratamento de Sessão Expirada:** Se qualquer requisição retornar status `401 Unauthorized`, a sessão é limpa do `localStorage` e o usuário é redirecionado para `/login`.

---

## 🔄 Ciclo de Vida da Ordem de Serviço (OS)

O fluxo de atendimento da Ordem de Serviço combina validações aplicadas pelo front-end com regras de persistência do back-end:

```
[ ABERTA ] ──► [ EM_ANDAMENTO ] ──► [ CONCLUIDA ] (Estado Final)
     │                 │
     ▼                 ├──────────► [ PAUSADA ] ──► [ EM_ANDAMENTO ]
[ CANCELADA ]          │
(Estado Final)         ▼
                 [ CANCELADA ] (Estado Final)
```

- **Restrições de Transição no Front-end:**
  O back-end aceita qualquer status do enum (`ABERTA`, `EM_ANDAMENTO`, `PAUSADA`, `CONCLUIDA`, `CANCELADA`) via `PATCH /ordens-servico/:id/status?status=...` sem validar a transição em si. A interface do **front-end** é quem restringe as opções exibidas para garantir a coerência do fluxo operacional:
  - De `ABERTA`: permite transitar para `EM_ANDAMENTO` ou `CANCELADA`.
  - De `EM_ANDAMENTO`: permite transitar para `PAUSADA`, `CONCLUIDA` ou `CANCELADA`.
  - De `PAUSADA`: permite retornar para `EM_ANDAMENTO` ou `CANCELADA`.
  - `CONCLUIDA` e `CANCELADA`: são tratadas como estados terminais pelo front-end, desabilitando ações de nova transição.

- **Validação de Materiais no Back-end:**
  O back-end rejeita expressamente a adição de novos materiais (`POST /ordens-servico/:id/materiais`) quando a OS está nos status `CONCLUIDA` ou `CANCELADA`.

- **Checklist Operacional:**
  - Enviado através de `POST /ordens-servico/:id/checklist` com os itens: `pressaoOk`, `temperaturaOk`, `limpezaOk`, `vazamentoVerificado` e `observacoesGerais`.
  - O back-end realiza operação de *upsert* com base no identificador da Ordem de Serviço: se já existir checklist gravado, ele é atualizado; caso contrário, é criado. Permite reenvios e correções a qualquer momento durante a execução.

- **Lançamento de Materiais:**
  - Realizado via `POST /ordens-servico/:id/materiais?idMaterial=...&quantidade=...`.
  - O preço unitário (`precoUnitarioCobrado`) é copiado automaticamente do cadastro do material no momento da inclusão (o front-end não envia o preço).
  - O back-end **não possui funcionalidade de remoção ou estorno** de materiais já lançados.

- **Cálculo do Valor Total:**
  - O `valorTotal` da OS é gerenciado e recalculado exclusivamente no back-end, somando o `valorMaoDeObra` com o total de cada material lançado (`quantidade * precoUnitarioCobrado`). A cada alteração, a tela de detalhe recarrega a OS completa retornada pela API.

- **Finalização e Vínculo com Agendamento:**
  - Ao concluir a OS, o back-end atualiza o status para `CONCLUIDA` e registra o timestamp em `dataConclusao`.
  - Caso a OS possua um agendamento vinculado, o front-end dispara automaticamente uma segunda requisição para concluir o agendamento correspondente: `PATCH /agendamentos/:id/status?status=CONCLUIDO`.

---

## 🖥️ Telas e Endpoints da API Consumidos

| Módulo / Tela | Rota no Front-end | Endpoints da API Consumidos | Descrição |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `/` | `POST /orcamentos`<br>`POST /contatos` | Página institucional pública com formulários de orçamento e contato. |
| **Login** | `/login` | `POST /auth/login` | Acesso administrativo para emissão do token JWT. |
| **Dashboard** | `/dashboard` | `GET /agendamentos`<br>`GET /ordens-servico`<br>`GET /clientes`<br>`GET /tecnicos/ativos` | Indicadores em tempo real, próximos agendamentos e tabela filtrável de ordens. |
| **Clientes** | `/clientes`<br>`/clientes/novo`<br>`/clientes/:id/editar` | `GET /clientes`<br>`GET /clientes/busca?nome=`<br>`POST /clientes`<br>`GET /clientes/:id`<br>`PUT /clientes/:id`<br>`DELETE /clientes/:id` | Listagem com busca por nome, cadastro estruturado com campos fracionados de endereço e edição com CPF bloqueado. |
| **Agendamentos** | `/agendamentos/novo` | `GET /clientes`<br>`GET /tecnicos/ativos`<br>`GET /servicos/ativos`<br>`POST /agendamentos`<br>`GET /agendamentos` | Agendamento de serviços com validação de conflitos e painel dinâmico da agenda do dia. |
| **Ordens de Serviço** | `/ordens-servico/nova`<br>`/ordens-servico/:id` | `GET /clientes`<br>`GET /tecnicos/ativos`<br>`GET /equipamentos`<br>`POST /equipamentos`<br>`GET /agendamentos`<br>`POST /ordens-servico`<br>`GET /ordens-servico/:id`<br>`PATCH /ordens-servico/:id/status`<br>`POST /ordens-servico/:id/checklist`<br>`GET /materiais`<br>`POST /ordens-servico/:id/materiais`<br>`PATCH /agendamentos/:id/status` | Criação de OS com seção expansível de equipamento rápido e seleção de agendamento pendente; tela de detalhe com controle de status, checklist, materiais, impressão e conclusão de agendamento vinculado. |
| **Técnicos** | `/tecnicos`<br>`/tecnicos/novo`<br>`/tecnicos/:id/editar` | `GET /tecnicos`<br>`GET /tecnicos/busca?nome=`<br>`POST /tecnicos`<br>`GET /tecnicos/:id`<br>`PUT /tecnicos/:id`<br>`PATCH /tecnicos/:id/status` | Gestão da equipe técnica com alternância de status ativo/inativo e busca por nome. |
| **Serviços** | `/servicos`<br>`/servicos/novo`<br>`/servicos/:id/editar` | `GET /servicos`<br>`GET /servicos/busca?nome=`<br>`POST /servicos`<br>`GET /servicos/:id`<br>`PUT /servicos/:id`<br>`PATCH /servicos/:id/status` | Catálogo de serviços com valor base, estimativa de tempo e busca por nome. |
| **Materiais** | `/materiais`<br>`/materiais/novo`<br>`/materiais/:id/editar` | `GET /materiais`<br>`GET /materiais/busca?descricao=`<br>`POST /materiais`<br>`GET /materiais/:id`<br>`PUT /materiais/:id`<br>`DELETE /materiais/:id` | Controle de insumos, unidade de medida, preço unitário e busca por descrição. |

---

## 🔍 Limitações Conhecidas do Back-end

Durante o desenvolvimento do front-end e a integração com a API, foram identificadas as seguintes características da camada de serviços:

1. **Persistência de Endereço em Campo Único:**  
   O `ClienteService` armazena e atualiza o endereço como string única concatenada. No cadastro, o front-end solicita dados fracionados (logradouro, número, bairro, cidade, CEP) e os junta antes do envio; na edição, o campo é mantido em entrada unificada para preservar os dados gravados.
2. **Imutabilidade do CPF:**  
   O `ClienteService.atualizar()` não permite alteração de CPF. O campo é mantido como somente leitura na tela de edição.
3. **Diagnóstico e Mão de Obra Imutáveis após Criação:**  
   Os campos de diagnóstico técnico e valor de mão de obra só podem ser preenchidos no momento da criação da OS (`POST /ordens-servico`). Não há endpoints de atualização para esses campos posteriormente.
4. **Irreversibilidade de Materiais Lançados:**  
   Uma vez adicionado um material à OS via `POST /ordens-servico/:id/materiais`, o back-end não disponibiliza endpoint para exclusão, estorno ou ajuste de quantidade do item.
5. **Equipamentos sem Vínculo Direto com Cliente:**  
   A entidade `Equipamento` é cadastrada de forma global e não possui chave estrangeira ligando-a ao cliente no banco de dados. Qualquer equipamento do catálogo pode ser selecionado para qualquer cliente.
6. **Cálculo de Indicadores (KPIs) no Front-end:**  
   O back-end não disponibiliza uma rota consolidada de estatísticas para o Dashboard. O front-end obtém as listagens completas (`/agendamentos`, `/ordens-servico`, `/clientes`, `/tecnicos/ativos`) e computa os totais e filtros localmente em memória.
7. **Técnico sem Usuário de Login:**  
   O cadastro de um técnico via `POST /tecnicos` cria registros em `Pessoa` e `Tecnico`, mas não cria credenciais na tabela `Usuario`. Embora a rota `POST /auth/registrar` permita criar um usuário com perfil `TECNICO`, a base de dados não possui relação de chave estrangeira entre `Usuario` e `Tecnico`. Portanto, não há vínculo automático nem sincronização entre a conta de login e o cadastro do técnico que executa as ordens de serviço.
8. **Detecção de Conflitos e Fuso Horário do Servidor:**  
   A validação de conflito de horários em `AgendamentoService` calcula a janela do dia entre `00:00:00` e `23:59:59` utilizando a data recebida no fuso horário local do ambiente do servidor. Caso o back-end seja hospedado em servidores configurados em UTC (padrão em ambientes cloud), agendamentos realizados no período noturno (como 21h ou 22h no horário de Brasília) podem cair no dia seguinte da conferência, impedindo a detecção de sobreposição. **Recomenda-se configurar a variável de ambiente `TZ=America/Sao_Paulo` no ambiente de hospedagem do back-end.**

---

## 🛡️ Observações de Segurança

1. **Rota de Registro Pública (`POST /auth/registrar`):**  
   O endpoint de registro de usuários não exige autenticação prévia nem chave administrativa, permitindo que qualquer pessoa com acesso à rede crie usuários, inclusive com o perfil `ADMIN`. Em ambientes de produção, essa rota deve ser protegida ou restrita a administradores logados.
2. **Rotas Administrativas Expostas sem JWT:**  
   As rotas de orçamentos (`/api/orcamentos`), contatos (`/api/contatos`) e solicitações de serviço (`/api/solicitacoes`) foram montadas em `app.ts` sem o middleware `autenticar`. Com isso, operações sensíveis como listagem geral, consulta por ID, alteração de status e exclusão de contatos podem ser acessadas publicamente sem token de autorização.
3. **Ausência de Controle de Acesso Baseado em Perfis (RBAC):**  
   Embora o middleware `autorizar` exista no código-fonte, ele não está aplicado nas rotas protegidas em `app.ts`. Assim, qualquer usuário logado (com perfil `ATENDENTE`, `TECNICO` ou `ADMIN`) possui os mesmos privilégios e tem acesso irrestrito a todas as operações protegidas por token.
4. **Isolamento de Variáveis de Ambiente:**  
   Arquivos contendo credenciais reais (`.env` no back-end e `.env.local` no front-end) estão devidamente incluídos no `.gitignore` e jamais devem ser enviados para repositórios públicos.

---

## 💡 Fluxo de Uso Recomendado

1. **Criação do Administrador:** Cadastre o primeiro usuário executando um `POST /auth/registrar` com perfil `ADMIN`.
2. **Login Inicial:** Acesse `http://localhost:5173/login` e informe as credenciais criadas.
3. **Configuração de Apoio:** Cadastre técnicos em `/tecnicos`, serviços oferecidos em `/servicos` e materiais em `/materiais`.
4. **Cadastro de Clientes:** Registre os clientes e endereços em `/clientes/novo`.
5. **Agendamento:** Crie um novo agendamento em `/agendamentos/novo`, escolhendo o cliente, o técnico disponível e o serviço.
6. **Abertura da OS:** Abra uma nova Ordem de Serviço em `/ordens-servico/nova`, selecionando o agendamento correspondente e vinculando o equipamento (usando a seção de cadastro rápido se o item ainda não estiver no catálogo).
7. **Execução Operacional:** Na tela de detalhes da OS (`/ordens-servico/:id`), altere o status para `EM_ANDAMENTO`, preencha e salve o checklist de inspeção e lance os materiais utilizados na manutenção.
8. **Conclusão:** Finalize o atendimento alterando o status para `CONCLUIDA` (o agendamento vinculado será concluído automaticamente pelo front-end) e utilize a função **Imprimir OS** para gerar a via do cliente.

---

## 👥 Equipe de Desenvolvimento

- Gabriel Bortoloti (GABBORTOLOTI31)- Desenvolvedor Geral
- João Victor (@OJotaa) - Desenvolvedor Geral
- Lucas Furco(@lfurco) - Desenvolvedor Geral
