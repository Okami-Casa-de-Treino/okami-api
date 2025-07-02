# 🏦 Payment API Routes

Documentação completa das rotas relacionadas a pagamentos no sistema Okami API.

## 📋 Índice

- [Collection Routes](#collection-routes)
- [Individual Payment Routes](#individual-payment-routes)
- [Payment Actions](#payment-actions)
- [Payment Queries](#payment-queries)
- [Student-Related Payment Routes](#student-related-payment-routes)
- [Detalhes das Rotas](#detalhes-das-rotas)
- [Permissões](#permissões)
- [Status e Métodos](#status-e-métodos)

---

## Collection Routes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/payments` | Listar todos os pagamentos |
| `POST` | `/api/payments` | Criar novo pagamento |

## Individual Payment Routes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/payments/{payment_id}` | Obter pagamento específico |
| `PUT` | `/api/payments/{payment_id}` | Atualizar pagamento |
| `DELETE` | `/api/payments/{payment_id}` | Deletar pagamento |

## Payment Actions

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/payments/{payment_id}/pay` | Marcar pagamento como pago |

## Payment Queries

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/payments/overdue` | Listar pagamentos em atraso |
| `GET` | `/api/payments/generate-monthly` | ⚠️ Não implementado |
| `POST` | `/api/payments/generate-monthly` | Gerar pagamentos mensais |
| `GET` | `/api/payments/student/{student_id}` | Pagamentos de um aluno específico |

## Student-Related Payment Routes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/students/{student_id}/payments` | Pagamentos do aluno (via rota de student) |

---

## Detalhes das Rotas

### 1. Listar Pagamentos
```http
GET /api/payments
```

**Query Parameters:**
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10, máx: 100)
- `search` (opcional): Busca por nome ou CPF do aluno
- `status` (opcional): Filtrar por status
- `sort` (opcional): Campo para ordenação
- `order` (opcional): `asc` ou `desc`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "amount": 150.00,
      "due_date": "2024-01-31",
      "payment_date": null,
      "payment_method": null,
      "status": "pending",
      "reference_month": "2024-01-01",
      "discount": 0,
      "late_fee": 0,
      "notes": "Mensalidade Janeiro",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "student": {
        "id": "uuid",
        "full_name": "João Silva",
        "email": "joao@email.com",
        "phone": "11999999999",
        "cpf": "12345678901",
        "status": "active"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 2. Criar Pagamento
```http
POST /api/payments
```

**Body:**
```json
{
  "student_id": "uuid",
  "amount": 150.00,
  "due_date": "2024-01-31",
  "reference_month": "2024-01",
  "discount": 0,
  "notes": "Mensalidade Janeiro"
}
```

**Campos Obrigatórios:**
- `student_id`: UUID do aluno
- `amount`: Valor (número positivo)
- `due_date`: Data de vencimento (YYYY-MM-DD)
- `reference_month`: Mês de referência (YYYY-MM)

**Campos Opcionais:**
- `discount`: Desconto (≥ 0)
- `notes`: Observações

### 3. Ver Pagamento Específico
```http
GET /api/payments/{payment_id}
```

**Resposta:** Objeto do pagamento com dados do aluno incluídos.

### 4. Atualizar Pagamento
```http
PUT /api/payments/{payment_id}
```

**Body:**
```json
{
  "payment_date": "2024-01-15",
  "payment_method": "pix",
  "status": "paid",
  "discount": 10.00,
  "late_fee": 5.00,
  "notes": "Pagamento atualizado"
}
```

**Campos Opcionais:**
- `payment_date`: Data do pagamento (YYYY-MM-DD)
- `payment_method`: Método de pagamento
- `status`: Status do pagamento
- `discount`: Desconto
- `late_fee`: Multa por atraso
- `notes`: Observações

### 5. Deletar Pagamento
```http
DELETE /api/payments/{payment_id}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Pagamento deletado com sucesso"
}
```

### 6. Marcar como Pago
```http
POST /api/payments/{payment_id}/pay
```

**Body:**
```json
{
  "payment_method": "pix",
  "payment_date": "2024-01-15"
}
```

**Campos Opcionais:**
- `payment_method`: Método de pagamento (padrão: "cash")
- `payment_date`: Data do pagamento (padrão: data atual)

### 7. Pagamentos em Atraso
```http
GET /api/payments/overdue
```

**Query Parameters:**
- `page`, `limit`, `search` (mesmo que listar pagamentos)

**Filtro:** Pagamentos com status `pending` e `due_date` anterior à data atual.

### 8. Gerar Pagamentos Mensais
```http
POST /api/payments/generate-monthly
```

**Body:**
```json
{
  "reference_month": "2024-02-01",
  "due_day": 10
}
```

**Campos Opcionais:**
- `reference_month`: Mês de referência no formato YYYY-MM-DD (padrão: mês atual)
- `due_day`: Dia do vencimento no mês (padrão: 10)

**Funcionalidade:**
- Busca todos os alunos ativos com `monthly_fee` definida
- Verifica se já existe pagamento para o mês de referência
- Gera pagamentos apenas para alunos que ainda não possuem cobrança do mês
- Evita duplicação de pagamentos

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "5 pagamentos mensais foram gerados com sucesso",
  "data": {
    "reference_month": "2024-02-01",
    "due_date": "2024-02-10",
    "total_active_students": 10,
    "students_with_existing_payment": 5,
    "payments_generated": 5,
    "generated_for_students": [
      {
        "id": "uuid",
        "name": "João Silva",
        "amount": 150.00
      }
    ]
  }
}
```

**Resposta quando nenhum pagamento é gerado:**
```json
{
  "success": true,
  "message": "Nenhum pagamento foi gerado. Todos os alunos ativos já possuem pagamento para este mês.",
  "data": {
    "reference_month": "2024-02-01",
    "due_date": "2024-02-10",
    "total_active_students": 10,
    "students_with_existing_payment": 10,
    "payments_generated": 0
  }
}
```

### 9. Pagamentos por Aluno
```http
GET /api/payments/student/{student_id}
```

**Query Parameters:**
- `page`, `limit`: Paginação
- `status`: Filtrar por status

### 10. Pagamentos do Aluno (via Student)
```http
GET /api/students/{student_id}/payments
```

**Query Parameters:** Mesmo que a rota anterior.

---

## 🔐 Permissões

| Ação | Roles Permitidas |
|------|------------------|
| **GET** (visualizar) | Todos os usuários autenticados |
| **POST** (criar) | `admin`, `receptionist` |
| **PUT** (atualizar) | `admin`, `receptionist` |
| **DELETE** (deletar) | `admin` apenas |
| **generate-monthly** | `admin` apenas |

---

## 📊 Status e Métodos

### Status Disponíveis
- `pending` - Pendente (padrão)
- `paid` - Pago
- `overdue` - Em atraso
- `cancelled` - Cancelado

### Métodos de Pagamento
- `cash` - Dinheiro
- `card` - Cartão
- `pix` - PIX
- `bank_transfer` - Transferência bancária

---

## 🚨 Observações Importantes

1. **Geração Automática**: O endpoint `generate-monthly` evita duplicação verificando pagamentos existentes
2. **Validação de UUID**: Todos os IDs devem ser UUIDs válidos
3. **Datas**: Formato obrigatório YYYY-MM-DD
4. **Valores**: Devem ser números positivos
5. **Autenticação**: Todas as rotas requerem token Bearer válido

---

## 📝 Exemplos de Uso

### Criar cobrança mensal
```bash
curl -X POST /api/payments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 150.00,
    "due_date": "2024-02-05",
    "reference_month": "2024-02",
    "notes": "Mensalidade Fevereiro 2024"
  }'
```

### Marcar como pago
```bash
curl -X POST /api/payments/{payment_id}/pay \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "pix",
    "payment_date": "2024-02-03"
  }'
```

### Listar pagamentos em atraso
```bash
curl -X GET "/api/payments/overdue?page=1&limit=20" \
  -H "Authorization: Bearer {token}"
``` 