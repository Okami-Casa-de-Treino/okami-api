# 🥋 Belt Progression Tracking System

Sistema completo para rastreamento de progressão de faixas dos alunos no Okami API.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Modelo de Dados](#modelo-de-dados)
- [API Routes](#api-routes)
- [Funcionalidades](#funcionalidades)
- [Exemplos de Uso](#exemplos-de-uso)
- [Migração do Banco](#migração-do-banco)

---

## 🎯 Visão Geral

O sistema de progressão de faixas permite:

- **Rastrear histórico completo** de promoções de cada aluno
- **Registrar detalhes** de cada promoção (quem promoveu, quando, requisitos atendidos)
- **Gerar estatísticas** de progressão e distribuição de faixas
- **Manter integridade** dos dados com transações
- **Suportar diferentes tipos** de promoção (regular, pulo de grau, honorária, correção)

---

## 📊 Modelo de Dados

### Student (Atualizado)
```sql
model Student {
  -- campos existentes...
  belt                String?         @db.VarChar(50)
  belt_degree         Int?            @default(0)  -- ALTERADO: agora inicia em 0
  -- campos existentes...
  belt_promotions     BeltPromotion[] -- NOVO: relação com promoções
}
```

### BeltPromotion (Novo)
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

### Promotion Types (Novo Enum)
```sql
enum promotion_type {
  regular      -- Promoção normal
  skip_degree  -- Pulo de grau
  honorary     -- Promoção honorária
  correction   -- Correção de faixa
}
```

---

## 🛣️ API Routes

### **Belt Management Routes**

| Método | Endpoint | Descrição | Permissões |
|--------|----------|-----------|------------|
| `POST` | `/api/belts/promote` | Promover aluno | `admin`, `teacher` |
| `GET` | `/api/belts/overview` | Visão geral das faixas | Todos |
| `GET` | `/api/students/{id}/belt-progress` | Progresso do aluno | Todos |
| `GET` | `/api/students/{id}/belt-history` | Histórico completo | Todos |
| `GET` | `/api/belts/statistics` | Estatísticas de promoções | `admin` |

---

## ⚙️ Funcionalidades

### 1. **Promoção de Aluno**
```http
POST /api/belts/promote
```

**Payload:**
```json
{
  "student_id": "uuid-do-aluno",
  "new_belt": "Faixa Amarela",
  "new_degree": 1,
  "promotion_type": "regular",
  "requirements_met": {
    "attendance": true,
    "technique_proficiency": true,
    "sparring_performance": true,
    "written_exam": false
  },
  "notes": "Excelente progresso técnico",
  "certificate_url": "https://example.com/certificate.pdf",
  "promotion_date": "2024-01-15"
}
```

**Funcionalidade:**
- ✅ Valida se aluno existe e está ativo
- ✅ Registra estado anterior (faixa/grau)
- ✅ Atualiza faixa atual do aluno
- ✅ Cria registro histórico da promoção
- ✅ Usa transação para garantir consistência

### 2. **Progresso do Aluno**
```http
GET /api/students/{id}/belt-progress
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "full_name": "João Silva",
      "current_belt": "Faixa Branca",
      "current_degree": 2,
      "enrollment_date": "2023-01-15",
      "status": "active"
    },
    "progress": {
      "days_since_enrollment": 365,
      "total_promotions": 3,
      "days_to_first_promotion": 120,
      "average_days_between_promotions": 90,
      "current_level": "Faixa Branca - 2º grau"
    },
    "recent_promotions": [
      {
        "id": "uuid",
        "previous_belt": "Faixa Branca",
        "previous_degree": 1,
        "new_belt": "Faixa Branca",
        "new_degree": 2,
        "promotion_date": "2024-01-15",
        "promotion_type": "regular",
        "promoted_by": "Sensei Maria",
        "notes": "Boa evolução técnica"
      }
    ]
  }
}
```

### 3. **Histórico Completo**
```http
GET /api/students/{id}/belt-history
```

Lista todas as promoções do aluno em ordem cronológica.

### 4. **Visão Geral das Faixas**
```http
GET /api/belts/overview
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "belt_distribution": [
      {
        "belt": "Faixa Branca",
        "degree": 0,
        "count": 25,
        "percentage": "35.7"
      },
      {
        "belt": "Faixa Branca",
        "degree": 1,
        "count": 15,
        "percentage": "21.4"
      }
    ],
    "summary": {
      "total_active_students": 70,
      "unique_belt_levels": 12,
      "most_common_belt": "Faixa Branca - 0º grau"
    }
  }
}
```

### 5. **Estatísticas de Promoções**
```http
GET /api/belts/statistics
```

**Dados incluídos:**
- Promoções por mês (últimos 12 meses)
- Distribuição por tipo de promoção
- Professores mais ativos em promoções
- Tempo médio entre promoções
- Estatísticas de retenção por faixa

---

## 📝 Exemplos de Uso

### **Promover um aluno**
```bash
curl -X POST /api/belts/promote \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "new_belt": "Faixa Amarela",
    "new_degree": 0,
    "promotion_type": "regular",
    "requirements_met": {
      "attendance": true,
      "technique": true,
      "sparring": true
    },
    "notes": "Excelente evolução técnica e disciplina"
  }'
```

### **Ver progresso do aluno**
```bash
curl -X GET "/api/students/{student_id}/belt-progress" \
  -H "Authorization: Bearer {token}"
```

### **Estatísticas gerais**
```bash
curl -X GET "/api/belts/overview" \
  -H "Authorization: Bearer {token}"
```

---

## 🔧 Migração do Banco

### **1. Atualizar Schema**
```bash
# Aplicar as mudanças no schema.prisma
bun prisma db push

# Ou criar migração
bun prisma migrate dev --name add-belt-promotion-system
```

### **2. Gerar Cliente Prisma**
```bash
bun prisma generate
```

### **3. Seed de Dados (Opcional)**
```typescript
// Criar promoções históricas para alunos existentes
const students = await prisma.student.findMany({
  where: { belt: { not: null } }
});

for (const student of students) {
  if (student.belt && student.belt !== 'Sem faixa') {
    await prisma.beltPromotion.create({
      data: {
        student_id: student.id,
        promoted_by: adminUserId,
        previous_belt: null,
        previous_degree: 0,
        new_belt: student.belt,
        new_degree: student.belt_degree || 0,
        promotion_type: 'regular',
        notes: 'Registro histórico - migração de dados'
      }
    });
  }
}
```

---

## 🚨 Considerações Importantes

### **Validações**
- ✅ Aluno deve estar ativo para ser promovido
- ✅ Não permitir promoção "para trás" (validação de negócio)
- ✅ Grau deve estar entre 0-10
- ✅ URLs de certificado devem ser válidas

### **Segurança**
- ✅ Apenas `admin` e `teacher` podem promover
- ✅ Histórico é imutável (não permite edição/exclusão)
- ✅ Auditoria completa de quem promoveu quando

### **Performance**
- ✅ Índices em campos frequentemente consultados
- ✅ Paginação em listagens
- ✅ Agregações otimizadas para estatísticas

### **Flexibilidade**
- ✅ Campo `requirements_met` em JSON para diferentes critérios
- ✅ Suporte a diferentes tipos de promoção
- ✅ Campo de observações para contexto adicional

---

## 🎯 Benefícios do Sistema

1. **📈 Acompanhamento Detalhado**: Histórico completo de progressão
2. **📊 Relatórios Ricos**: Estatísticas e insights de desempenho
3. **🔒 Auditoria Completa**: Rastreabilidade de todas as promoções
4. **🎖️ Motivação**: Alunos podem ver seu progresso claramente
5. **📋 Gestão**: Professores têm dados para tomada de decisão
6. **🏆 Reconhecimento**: Sistema formal de progressão e conquistas

Este sistema transforma o acompanhamento de faixas de um processo manual em uma ferramenta poderosa de gestão e motivação! 🥋 