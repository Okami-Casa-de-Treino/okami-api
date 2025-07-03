# 🥋 Belt Progression System - API Endpoints

Sistema completo de rastreamento de progressão de faixas com histórico de promoções.

## 📋 Endpoints Disponíveis

### 1. Listar Todas as Promoções
```http
GET /api/belts/promotions
```

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

### 2. Ver Promoção Específica
```http
GET /api/belts/promotions/{promotion_id}
```

**Resposta:** Objeto da promoção com detalhes completos do aluno e instrutor.

### 3. Promover Aluno
```http
POST /api/belts/promote
```

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
      "previous_belt": "Branca",
      "previous_degree": 0,
      "new_belt": "Azul",
      "new_degree": 1,
      "promotion_date": "2024-01-15T10:30:00.000Z",
      "notes": "Aluno demonstrou excelente técnica"
    }
  },
  "message": "João Silva foi promovido(a) para Azul 1º grau com sucesso"
}
```

### 4. Progresso do Aluno
```http
GET /api/students/{student_id}/belt-progress
```

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
        "promoted_by_user": {
          "username": "sensei_carlos",
          "role": "teacher"
        }
      }
    ]
  }
}
```

### 5. Visão Geral das Faixas
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
        "new_belt": "Azul",
        "promotion_date": "2024-01-15",
        "promoted_by": "sensei_carlos"
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
| `/api/belts/promote` | POST | `admin`, `teacher` |
| `/api/students/{id}/belt-progress` | GET | Todos os usuários autenticados |
| `/api/belts/overview` | GET | Todos os usuários autenticados |

---

## 📊 Tipos de Promoção

### Tipos Disponíveis:
- `regular` - Promoção normal seguindo critérios padrão
- `skip_degree` - Pular grau (ex: de 1º para 3º grau)
- `honorary` - Promoção honorária
- `correction` - Correção de promoção anterior

### Estrutura de Faixas Comum:
1. **Branca** (0-5 graus)
2. **Azul** (1-5 graus)
3. **Roxa** (1-5 graus)
4. **Marrom** (1-5 graus)
5. **Preta** (1-10 graus)

---

## 🚨 Observações Importantes

1. **Histórico Completo**: Todas as promoções são registradas com data, instrutor responsável e requisitos
2. **Validação**: Aluno deve estar ativo para ser promovido
3. **Auditoria**: Sistema mantém log completo de quem promoveu quem e quando
4. **Flexibilidade**: Suporte a diferentes tipos de promoção e requisitos customizáveis
5. **Certificados**: Possibilidade de anexar URL do certificado digital

---

## 📝 Exemplos de Uso

### Promover aluno
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
    "notes": "Excelente desempenho na avaliação"
  }'
```

### Ver progresso do aluno
```bash
curl -X GET /api/students/{student_id}/belt-progress \
  -H "Authorization: Bearer {token}"
```

### Listar promoções por faixa
```bash
curl -X GET "/api/belts/promotions?belt=Azul&limit=20" \
  -H "Authorization: Bearer {token}"
``` 