# Okami Gym Management API

Sistema completo de gestão de academia/escola de artes marciais desenvolvido com **Bun**, **PostgreSQL** e **Docker**.

## 🚀 Tecnologias

- **[Bun](https://bun.sh/)** - Runtime JavaScript/TypeScript ultra-rápido
- **PostgreSQL** - Banco de dados relacional
- **Docker & Docker Compose** - Containerização
- **TypeScript** - Tipagem estática
- **Zod** - Validação de schemas
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

## 📋 Funcionalidades

### ✅ Implementadas
- 🔐 **Sistema de Autenticação** (JWT)
- 🗄️ **Estrutura do Banco de Dados** (PostgreSQL)
- 🏗️ **Arquitetura da API** (Bun.serve)
- 📝 **Validação de Dados** (Zod)
- 🐳 **Docker Setup** completo
- 🔧 **Middleware de Autenticação**

### 🚧 Em Desenvolvimento
- 👥 **CRUD de Alunos**
- 👨‍🏫 **CRUD de Professores**
- 📚 **CRUD de Aulas**
- ✅ **Sistema de Check-in**
- 💰 **Sistema Financeiro**
- 📊 **Relatórios e Dashboard**

## 🛠️ Instalação e Configuração

### Pré-requisitos
- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) >= 20.0
- [Docker Compose](https://docs.docker.com/compose/) >= 2.0

### 1. Clone o repositório
```bash
git clone <repository-url>
cd okami-api
```

### 2. Instale as dependências
```bash
bun install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database Configuration
DATABASE_URL=postgres://okami_user:okami_password@localhost:5432/okami_gym

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🐳 Executando com Docker

### Desenvolvimento (recomendado)
```bash
# Inicia todos os serviços (PostgreSQL + API + Adminer)
bun run docker:dev

# Ou apenas o banco de dados
bun run db:setup
```

### Desenvolvimento local (sem Docker para API)
```bash
# Inicia apenas o PostgreSQL
bun run db:setup

# Em outro terminal, inicia a API localmente
bun run dev
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev          # Inicia a API com hot reload
bun run start        # Inicia a API em produção

# Docker
bun run docker:dev   # Docker Compose para desenvolvimento
bun run db:setup     # Inicia apenas o PostgreSQL

# Build e testes
bun run build        # Build da aplicação
bun run test         # Executa os testes
bun run lint         # Verifica tipos TypeScript

# Utilitários
bun run clean        # Limpa arquivos de build
```

## 🌐 Endpoints da API

### Autenticação
```http
POST   /api/auth/login     # Login do usuário
POST   /api/auth/refresh   # Renovar token
GET    /api/auth/profile   # Perfil do usuário
POST   /api/auth/logout    # Logout
```

### Alunos (Students)
```http
GET    /api/students              # Listar alunos
GET    /api/students/:id          # Buscar aluno por ID
POST   /api/students              # Criar aluno
PUT    /api/students/:id          # Atualizar aluno
DELETE /api/students/:id          # Deletar aluno
GET    /api/students/:id/checkins # Check-ins do aluno
GET    /api/students/:id/payments # Pagamentos do aluno
GET    /api/students/:id/classes  # Aulas do aluno
POST   /api/students/:id/classes  # Matricular em aula
```

### Professores (Teachers)
```http
GET    /api/teachers        # Listar professores
GET    /api/teachers/:id    # Buscar professor
POST   /api/teachers        # Criar professor
PUT    /api/teachers/:id    # Atualizar professor
DELETE /api/teachers/:id    # Deletar professor
```

### Aulas (Classes)
```http
GET    /api/classes           # Listar aulas
GET    /api/classes/:id       # Buscar aula
POST   /api/classes           # Criar aula
PUT    /api/classes/:id       # Atualizar aula
DELETE /api/classes/:id       # Deletar aula
GET    /api/classes/schedule  # Grade de horários
```

### Check-ins
```http
GET    /api/checkins         # Listar check-ins
POST   /api/checkins         # Registrar check-in
GET    /api/checkins/today   # Check-ins de hoje
```

### Pagamentos (Payments)
```http
GET    /api/payments                    # Listar pagamentos
GET    /api/payments/:id               # Buscar pagamento
POST   /api/payments                   # Criar cobrança
PUT    /api/payments/:id               # Atualizar pagamento
DELETE /api/payments/:id               # Deletar pagamento
POST   /api/payments/:id/pay           # Marcar como pago
GET    /api/payments/overdue           # Pagamentos em atraso
POST   /api/payments/generate-monthly  # Gerar cobranças mensais
```

### Relatórios (Reports) - Apenas Admin
```http
GET    /api/reports/dashboard   # Dashboard
GET    /api/reports/attendance  # Relatório de frequência
GET    /api/reports/financial   # Relatório financeiro
```

## 🔐 Autenticação

A API usa **JWT (JSON Web Tokens)** para autenticação. 

### Acesso ao Sistema:
- **API**: http://localhost:3000
- **Documentação da API (Swagger)**: http://localhost:3000/api-docs
- **Adminer** (Admin do banco): http://localhost:8080
- **Health Check**: http://localhost:3000/health

### Login padrão:
- **Usuário:** `admin`
- **Senha:** `admin123`

### Como usar:
1. Faça login em `/api/auth/login`
2. Use o token retornado no header `Authorization: Bearer <token>`
3. Renove o token em `/api/auth/refresh` quando necessário

## 🗄️ Estrutura do Banco de Dados

### Tabelas principais:
- **students** - Dados dos alunos
- **teachers** - Dados dos professores  
- **classes** - Aulas disponíveis
- **student_classes** - Matrículas (relacionamento aluno-aula)
- **checkins** - Registro de presenças
- **payments** - Controle financeiro
- **users** - Usuários do sistema

### Tipos de usuário:
- **admin** - Acesso total ao sistema
- **teacher** - Acesso a aulas e alunos
- **receptionist** - Acesso a check-ins e pagamentos

## 🔧 Ferramentas de Desenvolvimento

### Adminer (Database Admin)
Acesse: http://localhost:8080
- **Sistema:** PostgreSQL
- **Servidor:** postgres
- **Usuário:** okami_user
- **Senha:** okami_password
- **Base de dados:** okami_gym

### Health Check
Acesse: http://localhost:3000/health

## 📁 Estrutura do Projeto

```
okami-api/
├── src/
│   ├── config/          # Configurações (database, etc.)
│   ├── controllers/     # Controladores da API
│   ├── middleware/      # Middlewares (auth, validation, etc.)
│   ├── types/          # Definições TypeScript
│   ├── utils/          # Utilitários (validation, helpers)
│   └── index.ts        # Servidor principal
├── docker/             # Scripts de inicialização do banco
├── docker-compose.yml  # Configuração Docker
├── Dockerfile         # Imagem da aplicação
└── package.json       # Dependências e scripts
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Próximos Passos

- [ ] Implementar CRUD completo de todas as entidades
- [ ] Sistema de upload de fotos
- [ ] Geração de QR Codes para check-in
- [ ] Notificações por email/WhatsApp
- [ ] Relatórios em PDF
- [ ] App mobile para alunos
- [ ] Sistema de backup automático
- [ ] Integração com PIX

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ usando [Bun](https://bun.sh/)
# okami-api
