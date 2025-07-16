# 🥋 Belt Progression System - Complete API Reference

Sistema completo de rastreamento de progressão de faixas com histórico de promoções e funcionalidade de edição.

## 📋 Índice

- [Endpoints Disponíveis](#endpoints-disponíveis)
- [Permissões](#permissões)
- [Tipos de Promoção](#tipos-de-promoção)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Exemplos de Uso](#exemplos-de-uso)
- [Estrutura de Dados](#estrutura-de-dados)

---

## 🛣️ Endpoints Disponíveis

### 1. **Listar Todas as Promoções**
```http
GET /api/belts/promotions
```

**Permissões:** Todos os usuários autenticados  
**Método:** `getAll()`  

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máx: 100)
- `search`: Busca por nome do aluno, CPF ou faixa
- `belt`: Filtrar por faixa específica
- `promotion_type`: Filtrar por tipo de promoção
- `sort`: Campo para ordenação (padrão: promotion_date)
- `order`: Ordem (asc/desc, padrão: desc)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "promoted_by": "uuid",
      "previous_belt": "Branca",
      "previous_degree": 0,
      "new_belt": "Azul",
      "new_degree": 1,
      "promotion_date": "2024-01-15",
      "promotion_type": "regular",
      "requirements_met": {
        "technique_test": true,
        "sparring_test": true,
        "attendance": true
      },
      "notes": "Excelente desempenho na avaliação",
      "certificate_url": "https://example.com/cert.pdf",
      "student": {
        "id": "uuid",
        "full_name": "João Silva",
        "email": "joao@email.com",
        "phone": "11999999999",
        "cpf": "12345678901",
        "status": "active",
        "enrollment_date": "2023-06-01"
      },
      "promoted_by_user": {
        "id": "uuid",
        "username": "sensei_carlos",
        "role": "teacher"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. **Ver Promoção Específica**
```http
GET /api/belts/promotions/{promotion_id}
```

**Permissões:** Todos os usuários autenticados  
**Método:** `getById()`  

**Resposta:** Objeto da promoção com detalhes completos do aluno e instrutor.

### 3. **Promover Aluno** ⭐
```http
POST /api/belts/promote
```

**Permissões:** `admin`, `teacher`  
**Método:** `promoteStudent()`  

**Body:**
```json
{
  "student_id": "uuid",
  "new_belt": "Azul",
  "new_degree": 1,
  "promotion_type": "regular",
  "requirements_met": {
    "technique_test": true,
    "sparring_test": true,
    "attendance": true,
    "time_requirement": true
  },
  "notes": "Aluno demonstrou excelente técnica e dedicação",
  "certificate_url": "https://example.com/certificate.pdf",
  "promotion_date": "2024-01-15"
}
```

**Campos Obrigatórios:**
- `student_id`: UUID do aluno
- `new_belt`: Nova faixa
- `new_degree`: Novo grau (0-10)

**Campos Opcionais:**
- `promotion_type`: Tipo de promoção (regular, skip_degree, honorary, correction)
- `requirements_met`: Objeto JSON com requisitos atendidos
- `notes`: Observações sobre a promoção
- `certificate_url`: URL do certificado
- `promotion_date`: Data da promoção (padrão: hoje)

**Funcionalidades:**
- ✅ Valida se aluno existe e está ativo
- ✅ Registra estado anterior (faixa/grau)
- ✅ Atualiza faixa atual do aluno
- ✅ Cria registro histórico da promoção
- ✅ Usa transação para garantir consistência

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "full_name": "João Silva",
      "belt": "Azul",
      "belt_degree": 1,
      "email": "joao@email.com",
      "phone": "11999999999"
    },
    "promotion": {
      "id": "uuid",
      "previous_belt": "Branca",
      "previous_degree": 0,
      "new_belt": "Azul",
      "new_degree": 1,
      "promotion_date": "2024-01-15T10:30:00.000Z",
      "promotion_type": "regular",
      "requirements_met": { "technique_test": true },
      "notes": "Aluno demonstrou excelente técnica",
      "certificate_url": "https://example.com/certificate.pdf",
      "promoted_by": "Sensei Carlos"
    }
  },
  "message": "João Silva foi promovido(a) para Azul 1º grau com sucesso"
}
```

### 4. **Editar Promoção de Faixa** ✏️
```http
PUT /api/belts/promotions/{promotion_id}
```

**Permissões:** `admin`, `teacher`  
**Método:** `updateBeltPromotion()`  

**Body:**
```json
{
  "new_belt": "Roxa",
  "new_degree": 2,
  "promotion_type": "skip_degree",
  "requirements_met": {
    "technique_test": true,
    "sparring_test": true,
    "attendance": true,
    "written_exam": true
  },
  "notes": "Promoção atualizada - aluno demonstrou conhecimento avançado",
  "certificate_url": "https://example.com/updated-certificate.pdf",
  "promotion_date": "2024-01-20"
}
```

**Campos Opcionais (todos):**
- `new_belt`: Nova faixa
- `new_degree`: Novo grau (0-10)
- `promotion_type`: Tipo de promoção
- `requirements_met`: Objeto JSON com requisitos atendidos
- `notes`: Observações sobre a promoção
- `certificate_url`: URL do certificado
- `promotion_date`: Data da promoção

**Funcionalidades:**
- ✅ Atualiza registro da promoção
- ✅ Se for a promoção mais recente, atualiza faixa atual do aluno
- ✅ Usa transação para consistência de dados
- ✅ Mantém trilha de auditoria

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student": {
      "id": "uuid",
      "full_name": "João Silva",
      "belt": "Roxa",
      "belt_degree": 2,
      "email": "joao@email.com",
      "phone": "11999999999"
    },
    "previous_belt": "Branca",
    "previous_degree": 0,
    "new_belt": "Roxa",
    "new_degree": 2,
    "promotion_date": "2024-01-20T10:30:00.000Z",
    "promotion_type": "skip_degree",
    "requirements_met": {
      "technique_test": true,
      "sparring_test": true,
      "attendance": true,
      "written_exam": true
    },
    "notes": "Promoção atualizada - aluno demonstrou conhecimento avançado",
    "certificate_url": "https://example.com/updated-certificate.pdf",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z",
    "promoted_by": "Sensei Carlos"
  },
  "message": "Promoção de faixa atualizada com sucesso"
}
```

### 5. **Excluir Promoção de Faixa** 🗑️
```http
DELETE /api/belts/promotions/{promotion_id}
```

**Permissões:** `admin`  
**Método:** `deleteBeltPromotion()`  

**Funcionalidades:**
- ✅ Exclui registro da promoção
- ✅ Se for a promoção mais recente, atualiza faixa atual do aluno
- ✅ Se não houver mais promoções, remove faixa do aluno
- ✅ Usa transação para consistência de dados
- ✅ Mantém integridade do histórico

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Promoção de João Silva para Azul 1º grau foi excluída com sucesso"
}
```

### 6. **Progresso do Aluno**
```http
GET /api/students/{student_id}/belt-progress
```

**Permissões:** Todos os usuários autenticados  
**Método:** `getStudentBeltProgress()`  

**Resposta:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "full_name": "João Silva",
      "current_belt": "Azul",
      "current_degree": 1,
      "enrollment_date": "2023-06-01",
      "status": "active"
    },
    "progress": {
      "days_since_enrollment": 230,
      "current_level": "Azul - 1º grau",
      "total_promotions": 2,
      "last_promotion_date": "2024-01-15",
      "time_at_current_belt": 45
    },
    "promotion_history": [
      {
        "id": "uuid",
        "previous_belt": "Branca",
        "previous_degree": 0,
        "new_belt": "Azul",
        "new_degree": 1,
        "promotion_date": "2024-01-15",
        "promotion_type": "regular",
        "requirements_met": {
          "technique_test": true,
          "sparring_test": true,
          "attendance": true
        },
        "notes": "Excelente evolução técnica",
        "certificate_url": "https://example.com/certificate.pdf",
        "promoted_by_user": {
          "id": "uuid",
          "username": "sensei_carlos",
          "role": "teacher",
          "teacher_name": "Sensei Carlos",
          "teacher_belt": "Preta",
          "teacher_degree": 5
        }
      }
    ]
  }
}
```

### 7. **Visão Geral das Faixas**
```http
GET /api/belts/overview
```

**Permissões:** Todos os usuários autenticados  
**Método:** `getBeltOverview()`  

**Resposta:**
```json
{
  "success": true,
  "data": {
    "belt_distribution": [
      {
        "belt": "Branca",
        "degree": 0,
        "count": 15,
        "percentage": "30.0"
      },
      {
        "belt": "Azul",
        "degree": 1,
        "count": 12,
        "percentage": "24.0"
      },
      {
        "belt": "Roxa",
        "degree": 2,
        "count": 8,
        "percentage": "16.0"
      }
    ],
    "summary": {
      "total_active_students": 50,
      "unique_belt_levels": 8,
      "recent_promotions": 5,
      "promotions_this_month": 3
    },
    "recent_promotions": [
      {
        "student_name": "João Silva",
        "previous_belt": "Branca",
        "previous_degree": 0,
        "new_belt": "Azul",
        "new_degree": 1,
        "promotion_date": "2024-01-15",
        "promotion_type": "regular",
        "promoted_by": "Sensei Carlos"
      }
    ]
  }
}
```

---

## 🔐 Permissões

| Endpoint | Método | Roles Permitidas |
|----------|--------|------------------|
| `/api/belts/promotions` | GET | Todos os usuários autenticados |
| `/api/belts/promotions/{id}` | GET | Todos os usuários autenticados |
| `/api/belts/promotions/{id}` | PUT | `admin`, `teacher` |
| `/api/belts/promotions/{id}` | DELETE | `admin` |
| `/api/belts/promote` | POST | `admin`, `teacher` |
| `/api/students/{id}/belt-progress` | GET | Todos os usuários autenticados |
| `/api/belts/overview` | GET | Todos os usuários autenticados |

---

## 🎯 Tipos de Promoção

### Tipos Disponíveis:
- **`regular`** - Promoção normal seguindo critérios padrão
- **`skip_degree`** - Pular grau (ex: de 1º para 3º grau)
- **`honorary`** - Promoção honorária
- **`correction`** - Correção de promoção anterior

### Estrutura de Faixas Comum:
1. **Branca** (0-5 graus)
2. **Azul** (1-5 graus)
3. **Roxa** (1-5 graus)
4. **Marrom** (1-5 graus)
5. **Preta** (1-10 graus)

---

## ⚙️ Funcionalidades Principais

### **Integridade de Dados**
- ✅ Transações de banco garantem consistência
- ✅ Faixa atual do aluno atualizada automaticamente
- ✅ Trilha de auditoria completa mantida
- ✅ Validação de todas as entradas

### **Flexibilidade**
- ✅ Rastreamento de requisitos customizados (campo JSON)
- ✅ URLs de certificado opcionais
- ✅ Notas e observações
- ✅ Diferentes tipos de promoção

### **Relatórios**
- ✅ Estatísticas de distribuição de faixas
- ✅ Acompanhamento de progresso do aluno
- ✅ Visão geral de promoções recentes
- ✅ Análises baseadas em tempo

### **Busca e Filtragem**
- ✅ Suporte a paginação
- ✅ Busca por nome/CPF/faixa do aluno
- ✅ Filtro por tipo de faixa e tipo de promoção
- ✅ Resultados ordenáveis

---

## 📝 Exemplos de Uso

### **Promover um aluno**
```bash
curl -X POST /api/belts/promote \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "new_belt": "Azul",
    "new_degree": 1,
    "promotion_type": "regular",
    "requirements_met": {
      "technique_test": true,
      "sparring_test": true,
      "attendance": true
    },
    "notes": "Excelente evolução técnica e disciplina"
  }'
```

### **Editar uma promoção**
```bash
curl -X PUT /api/belts/promotions/{promotion_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "new_belt": "Roxa",
    "new_degree": 2,
    "promotion_type": "skip_degree",
    "notes": "Promoção atualizada após reavaliação",
    "requirements_met": {
      "technique_test": true,
      "sparring_test": true,
      "attendance": true,
      "written_exam": true
    }
  }'
```

### **Excluir uma promoção**
```bash
curl -X DELETE /api/belts/promotions/{promotion_id} \
  -H "Authorization: Bearer {token}"
```

### **Ver progresso do aluno**
```bash
curl -X GET /api/students/{student_id}/belt-progress \
  -H "Authorization: Bearer {token}"
```

### **Listar promoções por faixa**
```bash
curl -X GET "/api/belts/promotions?belt=Azul&limit=20" \
  -H "Authorization: Bearer {token}"
```

### **Buscar promoções por tipo**
```bash
curl -X GET "/api/belts/promotions?promotion_type=skip_degree" \
  -H "Authorization: Bearer {token}"
```

### **Estatísticas gerais**
```bash
curl -X GET "/api/belts/overview" \
  -H "Authorization: Bearer {token}"
```

---

## 📊 Estrutura de Dados

### **BeltPromotion Model**
```sql
model BeltPromotion {
  id                String              @id @default(dbgenerated("uuid_generate_v4()"))
  student_id        String              @db.Uuid
  promoted_by       String              @db.Uuid
  previous_belt     String?             @db.VarChar(50)
  previous_degree   Int?                @default(0)
  new_belt          String              @db.VarChar(50)
  new_degree        Int                 @default(0)
  promotion_date    DateTime            @default(now()) @db.Date
  promotion_type    promotion_type      @default(regular)
  requirements_met  Json?               -- Requisitos atendidos (flexível)
  notes             String?             -- Observações da promoção
  certificate_url   String?             @db.VarChar(500)
  created_at        DateTime?           @default(now())
  updated_at        DateTime?           @default(now()) @updatedAt
  
  -- Relações
  student           Student             @relation(fields: [student_id], references: [id])
  promoted_by_user  User                @relation(fields: [promoted_by], references: [id])
}
```

### **Promotion Types Enum**
```sql
enum promotion_type {
  regular      -- Promoção normal
  skip_degree  -- Pulo de grau
  honorary     -- Promoção honorária
  correction   -- Correção de faixa
}
```

---

## 🚨 Observações Importantes

1. **Histórico Completo**: Todas as promoções são registradas com data, instrutor responsável e requisitos
2. **Validação**: Aluno deve estar ativo para ser promovido
3. **Auditoria**: Sistema mantém log completo de quem promoveu quem e quando
4. **Flexibilidade**: Suporte a diferentes tipos de promoção e requisitos customizáveis
5. **Certificados**: Possibilidade de anexar URL do certificado digital
6. **Edição Segura**: Promoções podem ser editadas mantendo integridade dos dados
7. **Consistência**: Transações garantem que dados do aluno e promoção permaneçam sincronizados

---

## 🎯 Benefícios do Sistema

1. **📈 Acompanhamento Detalhado**: Histórico completo de progressão
2. **📊 Relatórios Ricos**: Estatísticas e insights de desempenho
3. **🔒 Auditoria Completa**: Rastreabilidade de todas as promoções
4. **🎖️ Motivação**: Alunos podem ver seu progresso claramente
5. **📋 Gestão**: Professores têm dados para tomada de decisão
6. **🏆 Reconhecimento**: Sistema formal de progressão e conquistas
7. **✏️ Flexibilidade**: Capacidade de editar promoções quando necessário

Este sistema transforma o acompanhamento de faixas de um processo manual em uma ferramenta poderosa de gestão e motivação! 🥋 