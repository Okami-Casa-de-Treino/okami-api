# Estrutura Completa da Aplicação - Sistema de Gestão de Academia

## 📋 Visão Geral do Sistema

Sistema completo para gestão de academia/escola de artes marciais com funcionalidades de cadastro, check-in, financeiro e relatórios.

---

## 🗂️ Estrutura de Pastas

### Backend (Node.js)
```
backend/
├── src/
│   ├── controllers/
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── classController.js
│   │   ├── checkinController.js
│   │   ├── financialController.js
│   │   ├── authController.js
│   │   └── reportController.js
│   ├── models/
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Class.js
│   │   ├── Checkin.js
│   │   ├── Payment.js
│   │   └── User.js
│   ├── routes/
│   │   ├── students.js
│   │   ├── teachers.js
│   │   ├── classes.js
│   │   ├── checkins.js
│   │   ├── financial.js
│   │   ├── auth.js
│   │   └── reports.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── database.js
│   │   ├── helpers.js
│   │   └── constants.js
│   └── config/
│       ├── database.js
│       └── server.js
├── package.json
└── server.js
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Loading.jsx
│   │   ├── students/
│   │   │   ├── StudentList.jsx
│   │   │   ├── StudentForm.jsx
│   │   │   ├── StudentProfile.jsx
│   │   │   └── StudentCheckins.jsx
│   │   ├── teachers/
│   │   │   ├── TeacherList.jsx
│   │   │   ├── TeacherForm.jsx
│   │   │   └── TeacherProfile.jsx
│   │   ├── classes/
│   │   │   ├── ClassList.jsx
│   │   │   ├── ClassForm.jsx
│   │   │   ├── ClassSchedule.jsx
│   │   │   └── ClassCheckins.jsx
│   │   ├── checkin/
│   │   │   ├── CheckinPanel.jsx
│   │   │   ├── QRCodeScanner.jsx
│   │   │   └── CheckinHistory.jsx
│   │   └── financial/
│   │       ├── PaymentList.jsx
│   │       ├── PaymentForm.jsx
│   │       ├── FinancialDashboard.jsx
│   │       └── PaymentHistory.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Students.jsx
│   │   ├── Teachers.jsx
│   │   ├── Classes.jsx
│   │   ├── Checkin.jsx
│   │   ├── Financial.jsx
│   │   ├── Reports.jsx
│   │   └── Login.jsx
│   ├── hooks/
│   │   ├── useApi.js
│   │   ├── useAuth.js
│   │   └── useLocalStorage.js
│   ├── services/
│   │   ├── api.js
│   │   ├── studentService.js
│   │   ├── teacherService.js
│   │   ├── classService.js
│   │   ├── checkinService.js
│   │   └── financialService.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── constants.js
│   └── styles/
│       ├── globals.css
│       └── components/
├── package.json
└── public/
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. Students (Alunos)
```sql
students (
  id: UUID PRIMARY KEY,
  full_name: VARCHAR(255) NOT NULL,
  birth_date: DATE NOT NULL,
  cpf: VARCHAR(14) UNIQUE,
  rg: VARCHAR(20),
  belt: VARCHAR(50), -- Faixa atual
  belt_degree: INTEGER DEFAULT 1, -- Grau da faixa
  address: TEXT,
  phone: VARCHAR(20),
  email: VARCHAR(255),
  emergency_contact_name: VARCHAR(255),
  emergency_contact_phone: VARCHAR(20),
  emergency_contact_relationship: VARCHAR(100),
  medical_observations: TEXT,
  photo_url: VARCHAR(500),
  enrollment_date: DATE DEFAULT CURRENT_DATE,
  monthly_fee: DECIMAL(10,2),
  status: ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### 2. Teachers (Professores)
```sql
teachers (
  id: UUID PRIMARY KEY,
  full_name: VARCHAR(255) NOT NULL,
  birth_date: DATE,
  cpf: VARCHAR(14) UNIQUE,
  phone: VARCHAR(20),
  email: VARCHAR(255),
  belt: VARCHAR(50),
  belt_degree: INTEGER,
  specialties: JSON, -- Especialidades do professor
  hourly_rate: DECIMAL(10,2),
  status: ENUM('active', 'inactive') DEFAULT 'active',
  created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### 3. Classes (Aulas)
```sql
classes (
  id: UUID PRIMARY KEY,
  name: VARCHAR(255) NOT NULL,
  description: TEXT,
  teacher_id: UUID REFERENCES teachers(id),
  day_of_week: INTEGER, -- 0=Domingo, 1=Segunda, etc.
  start_time: TIME,
  end_time: TIME,
  max_students: INTEGER DEFAULT 30,
  belt_requirement: VARCHAR(50), -- Faixa mínima necessária
  age_group: VARCHAR(50), -- Infantil, Juvenil, Adulto
  status: ENUM('active', 'inactive') DEFAULT 'active',
  created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### 4. Student_Classes (Relacionamento Aluno-Aula)
```sql
student_classes (
  id: UUID PRIMARY KEY,
  student_id: UUID REFERENCES students(id),
  class_id: UUID REFERENCES classes(id),
  enrollment_date: DATE DEFAULT CURRENT_DATE,
  status: ENUM('active', 'inactive') DEFAULT 'active',
  created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, class_id)
)
```

#### 5. Checkins
```sql
checkins (
  id: UUID PRIMARY KEY,
  student_id: UUID REFERENCES students(id),
  class_id: UUID REFERENCES classes(id),
  checkin_date: DATE,
  checkin_time: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  method: ENUM('manual', 'qr_code', 'app') DEFAULT 'manual',
  notes: TEXT,
  created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### 6. Payments (Pagamentos)
```sql
payments (
  id: UUID PRIMARY KEY,
  student_id: UUID REFERENCES students(id),
  amount: DECIMAL(10,2) NOT NULL,
  due_date: DATE NOT NULL,
  payment_date: DATE,
  payment_method: ENUM('cash', 'card', 'pix', 'bank_transfer'),
  status: ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  reference_month: DATE, -- Mês de referência do pagamento
  discount: DECIMAL(10,2) DEFAULT 0,
  late_fee: DECIMAL(10,2) DEFAULT 0,
  notes: TEXT,
  created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### 7. Users (Sistema de Login)
```sql
users (
  id: UUID PRIMARY KEY,
  username: VARCHAR(100) UNIQUE NOT NULL,
  email: VARCHAR(255) UNIQUE,
  password_hash: VARCHAR(255) NOT NULL,
  role: ENUM('admin', 'teacher', 'receptionist') DEFAULT 'receptionist',
  teacher_id: UUID REFERENCES teachers(id), -- Se for professor
  status: ENUM('active', 'inactive') DEFAULT 'active',
  created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

---

## 🔗 Rotas da API (Backend)

### Autenticação
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/profile
```

### Alunos
```
GET    /api/students              # Listar todos os alunos
GET    /api/students/:id          # Buscar aluno por ID
POST   /api/students              # Criar novo aluno
PUT    /api/students/:id          # Atualizar aluno
DELETE /api/students/:id          # Deletar aluno
GET    /api/students/:id/checkins # Histórico de check-ins do aluno
GET    /api/students/:id/payments # Histórico de pagamentos do aluno
GET    /api/students/:id/classes  # Aulas do aluno
POST   /api/students/:id/classes  # Matricular aluno em aula
DELETE /api/students/:id/classes/:classId # Desmatricular aluno
```

### Professores
```
GET    /api/teachers              # Listar todos os professores
GET    /api/teachers/:id          # Buscar professor por ID
POST   /api/teachers              # Criar novo professor
PUT    /api/teachers/:id          # Atualizar professor
DELETE /api/teachers/:id          # Deletar professor
GET    /api/teachers/:id/classes  # Aulas do professor
```

### Aulas
```
GET    /api/classes               # Listar todas as aulas
GET    /api/classes/:id           # Buscar aula por ID
POST   /api/classes               # Criar nova aula
PUT    /api/classes/:id           # Atualizar aula
DELETE /api/classes/:id           # Deletar aula
GET    /api/classes/:id/students  # Alunos matriculados na aula
GET    /api/classes/:id/checkins  # Check-ins da aula
GET    /api/classes/schedule      # Grade de horários
```

### Check-ins
```
GET    /api/checkins              # Listar check-ins (com filtros)
POST   /api/checkins              # Registrar check-in
GET    /api/checkins/today        # Check-ins de hoje
GET    /api/checkins/student/:id  # Check-ins de um aluno específico
GET    /api/checkins/class/:id    # Check-ins de uma aula específica
DELETE /api/checkins/:id          # Deletar check-in
```

### Financeiro
```
GET    /api/payments              # Listar pagamentos (com filtros)
GET    /api/payments/:id          # Buscar pagamento por ID
POST   /api/payments              # Criar cobrança
PUT    /api/payments/:id          # Atualizar pagamento
DELETE /api/payments/:id          # Deletar pagamento
POST   /api/payments/:id/pay      # Marcar como pago
GET    /api/payments/overdue      # Pagamentos em atraso
GET    /api/payments/student/:id  # Pagamentos de um aluno
POST   /api/payments/generate-monthly # Gerar cobranças mensais
```

### Relatórios
```
GET    /api/reports/dashboard     # Dados do dashboard
GET    /api/reports/attendance    # Relatório de frequência
GET    /api/reports/financial     # Relatório financeiro
GET    /api/reports/students      # Relatório de alunos
GET    /api/reports/classes       # Relatório de aulas
```

---

## 🎨 Páginas do Frontend

### 1. Dashboard
- Resumo geral (alunos ativos, aulas hoje, pagamentos pendentes)
- Gráficos de frequência
- Próximas aulas
- Pagamentos vencendo

### 2. Gestão de Alunos
- Lista de alunos com filtros
- Formulário de cadastro/edição
- Perfil completo do aluno
- Histórico de check-ins
- Histórico de pagamentos

### 3. Gestão de Professores
- Lista de professores
- Formulário de cadastro/edição
- Perfil do professor
- Aulas ministradas

### 4. Gestão de Aulas
- Lista de aulas
- Grade de horários
- Formulário de cadastro/edição
- Lista de alunos matriculados
- Check-ins da aula

### 5. Área de Check-in
- Interface rápida para check-in
- Scanner de QR Code
- Lista de aulas do dia
- Check-ins recentes

### 6. Financeiro
- Lista de pagamentos
- Formulário de cobrança
- Dashboard financeiro
- Relatórios de inadimplência
- Geração de cobranças mensais

### 7. Relatórios
- Relatório de frequência
- Relatório financeiro
- Relatório de alunos
- Exportação em PDF/Excel

---

## 🔧 Funcionalidades Especiais

### Sistema de Check-in
- Check-in manual pelo sistema
- QR Code individual para cada aluno
- Check-in via aplicativo mobile (futuro)
- Histórico completo de presenças

### Sistema Financeiro
- Geração automática de mensalidades
- Controle de vencimentos
- Multas por atraso
- Descontos personalizados
- Múltiplos métodos de pagamento

### Sistema de Graduação
- Controle de faixas e graus
- Histórico de graduações
- Requisitos por faixa

### Recursos Adicionais Sugeridos
- Sistema de notificações (WhatsApp/Email)
- Backup automático de dados
- Relatórios automáticos por email
- Sistema de cupons/descontos
- Integração com PIX
- App mobile para alunos
- Sistema de avaliações/notas
- Controle de inventário (kimonos, equipamentos)
- Sistema de eventos/competições
- Chat interno para comunicação

---

## 🛡️ Segurança e Validações

### Backend
- Autenticação JWT
- Validação de dados com Joi/Yup
- Rate limiting
- Logs de auditoria
- Criptografia de senhas

### Frontend
- Validação de formulários
- Sanitização de dados
- Controle de acesso por roles
- Sessão segura

---

## 📱 Responsividade

O sistema será totalmente responsivo, funcionando em:
- Desktop
- Tablet
- Mobile
- TV (para área de check-in)

---

Esta estrutura fornece uma base sólida e escalável para o desenvolvimento do sistema. Cada módulo é independente, facilitando a implementação gradual e manutenção futura.