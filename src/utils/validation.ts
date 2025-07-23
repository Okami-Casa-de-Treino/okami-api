import { z } from "zod";

// Student validation schemas
export const createStudentSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter apenas 11 dígitos").optional(),
  rg: z.string().optional(),
  belt: z.string().optional(),
  belt_degree: z.number().int().min(0).max(10).nullable().optional(),
  address: z.string().optional(),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone deve conter apenas dígitos (10 ou 11 dígitos)").optional(),
  email: z.string().email("Email inválido").optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  medical_observations: z.string().optional(),
  monthly_fee: z.union([
    z.number().min(0, "Mensalidade não pode ser negativa"),
    z.null()
  ]).optional(),
  // Authentication field (optional)
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

// Teacher validation schemas
export const createTeacherSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birth_date: z.string()
    .transform(val => {
      // Handle ISO datetime format by extracting just the date part
      if (val && val.includes('T')) {
        return val.split('T')[0];
      }
      return val;
    })
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"))
    .nullable()
    .optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter apenas 11 dígitos").optional(),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone deve conter apenas dígitos (10 ou 11 dígitos)").optional(),
  email: z.string().email("Email inválido").optional(),
  belt: z.string().optional(),
  belt_degree: z.number().int().min(0).max(10).nullable().optional(),
  specialties: z.array(z.string()).optional(),
  hourly_rate: z.union([
    z.number().min(0, "Valor por hora não pode ser negativo"),
    z.null()
  ]).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

// Class validation schemas
export const createClassSchema = z.object({
  name: z.string().min(2, "Nome da aula deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  teacher_id: z.string().uuid("ID do professor deve ser um UUID válido").optional(),
  days_of_week: z.array(z.number().int().min(0).max(6, "Dia da semana deve ser entre 0 (domingo) e 6 (sábado)"))
    .min(1, "Deve ter pelo menos um dia da semana")
    .refine(days => [...new Set(days)].length === days.length, "Não pode haver dias duplicados"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  max_students: z.union([
    z.number().int().positive("Número máximo de alunos deve ser positivo"),
    z.null()
  ]).optional(),
  belt_requirement: z.string().optional(),
  age_group: z.string().optional(),
});

export const updateClassSchema = createClassSchema.partial();

// Checkin validation schemas
export const createCheckinSchema = z.object({
  student_id: z.string().uuid("ID do aluno deve ser um UUID válido"),
  class_id: z.string().uuid("ID da aula deve ser um UUID válido").optional(),
  method: z.enum(["manual", "qr_code", "app"]).optional(),
  notes: z.string().optional(),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  student_id: z.string().uuid("ID do aluno deve ser um UUID válido"),
  amount: z.number().positive("Valor deve ser positivo"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, "Mês de referência deve estar no formato YYYY-MM"),
  discount: z.number().min(0, "Desconto não pode ser negativo").nullable().optional(),
  notes: z.string().optional(),
});

// Expense validation schemas
export const createExpenseSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(255, "Título deve ter no máximo 255 caracteres"),
  description: z.string().optional(),
  amount: z.number().positive("Valor deve ser positivo"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  category: z.enum(["rent", "utilities", "insurance", "taxes", "loans", "credit_cards", "services", "supplies", "maintenance", "other"]).optional(),
  creditor: z.string().max(255, "Credor deve ter no máximo 255 caracteres").optional(),
  reference_number: z.string().max(100, "Número de referência deve ter no máximo 100 caracteres").optional(),
  discount: z.number().min(0, "Desconto não pode ser negativo").nullable().optional(),
  late_fee: z.union([z.number().min(0, "Multa não pode ser negativa"), z.null()]).optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled", "partial"]).optional(),
  payment_method: z.enum(["cash", "card", "pix", "bank_transfer"]).optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(255, "Título deve ter no máximo 255 caracteres").optional(),
  description: z.string().optional(),
  amount: z.number().positive("Valor deve ser positivo").optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  payment_method: z.enum(["cash", "card", "pix", "bank_transfer"]).optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled", "partial"]).optional(),
  category: z.enum(["rent", "utilities", "insurance", "taxes", "loans", "credit_cards", "services", "supplies", "maintenance", "other"]).optional(),
  creditor: z.string().max(255, "Credor deve ter no máximo 255 caracteres").optional(),
  reference_number: z.string().max(100, "Número de referência deve ter no máximo 100 caracteres").optional(),
  discount: z.union([z.number().min(0, "Desconto não pode ser negativo"), z.null()]).optional(),
  late_fee: z.union([z.number().min(0, "Multa não pode ser negativa"), z.null()]).optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  payment_method: z.enum(["cash", "card", "pix", "bank_transfer"]).optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  discount: z.number().min(0, "Desconto não pode ser negativo").nullable().optional(),
  late_fee: z.number().min(0, "Multa não pode ser negativa").nullable().optional(),
  notes: z.string().optional(),
});

// Auth validation schemas
export const loginSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const createUserSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "teacher", "receptionist"]).optional(),
  teacher_id: z.string().uuid("ID do professor deve ser um UUID válido").optional(),
});

// Query validation schemas
export const paginationSchema = z.object({
  page: z.string().optional().default("1").transform(val => parseInt(val) || 1),
  limit: z.string().optional().default("10").transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const dateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
});

// Utility functions
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function validateCPF(cpf: string | undefined): boolean {
  if (!cpf) return false;
  // Remove formatting
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check for repeated digits
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    if (typeof cleanCPF[i] === 'undefined') return false;
    sum += parseInt(cleanCPF[i]!) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  
  if (typeof cleanCPF[9] === 'undefined' || digit1 !== parseInt(cleanCPF[9]!)) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    if (typeof cleanCPF[i] === 'undefined') return false;
    sum += parseInt(cleanCPF[i]!) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  
  if (typeof cleanCPF[10] === 'undefined') return false;
  return digit2 === parseInt(cleanCPF[10]!);
}

export function formatCPF(cpf: string | undefined): string {
  if (!cpf) return '';
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone: string | undefined): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[^\d]/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return cleanPhone || phone || '';
}

export function cleanPhone(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

export function cleanCPF(cpf: string | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/[^\d]/g, '');
}

// Video validation schemas
export const createVideoSchema = z.object({
  title: z.string().min(1, "Título deve ter pelo menos 1 caractere").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().optional(),
  file_url: z.string().url("URL do arquivo deve ser válida").max(500, "URL do arquivo deve ter no máximo 500 caracteres"),
  thumbnail_url: z.string().optional().refine((val): val is string => !val || (/^https?:\/\/.+/.test(val) && val.length <= 500), "URL da thumbnail deve ser válida e ter no máximo 500 caracteres"),
  module_id: z.string().refine((val): val is string => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "ID do módulo deve ser um UUID válido"),
  assigned_class_id: z.string().optional().refine((val): val is string => !val || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "ID da aula deve ser um UUID válido"),
  duration: z.number().int().positive("Duração deve ser um número positivo").optional(),
  file_size: z.number().int().positive("Tamanho do arquivo deve ser um número positivo").optional(),
  mime_type: z.string().max(100, "Tipo MIME deve ter no máximo 100 caracteres").optional(),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1, "Título deve ter pelo menos 1 caractere").max(100, "Título deve ter no máximo 100 caracteres").optional(),
  description: z.string().optional(),
  file_url: z.string().url("URL do arquivo deve ser válida").max(500, "URL do arquivo deve ter no máximo 500 caracteres").optional(),
  thumbnail_url: z.string().optional().refine((val): val is string => !val || (/^https?:\/\/.+/.test(val) && val.length <= 500), "URL da thumbnail deve ser válida e ter no máximo 500 caracteres"),
  module_id: z.string().refine((val): val is string => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "ID do módulo deve ser um UUID válido").optional(),
  assigned_class_id: z.string().optional().refine((val): val is string => !val || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "ID da aula deve ser um UUID válido"),
  duration: z.number().int().positive("Duração deve ser um número positivo").optional(),
  file_size: z.number().int().positive("Tamanho do arquivo deve ser um número positivo").optional(),
  mime_type: z.string().max(100, "Tipo MIME deve ter no máximo 100 caracteres").optional(),
});

export const videoQuerySchema = z.object({
  page: z.string().optional().default("1").transform(val => parseInt(val) || 1),
  limit: z.string().optional().default("10").transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  module_id: z.string().optional().refine((val): val is string => !val || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "ID do módulo deve ser um UUID válido"),
  assigned_class_id: z.string().optional().refine((val): val is string => !val || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "ID da aula deve ser um UUID válido"),
  sort_by: z.enum(["title", "upload_date", "duration"]).optional().default("upload_date"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Module validation schemas
export const createModuleSchema = z.object({
  name: z.string().min(1, "Nome deve ter pelo menos 1 caractere").max(50, "Nome deve ter no máximo 50 caracteres"),
  description: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)").default("#3B82F6"),
  order: z.number().int().min(0, "Ordem deve ser um número não negativo").default(0),
});

export const updateModuleSchema = createModuleSchema.partial(); 