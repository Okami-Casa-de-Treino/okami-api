import { z } from "zod";

// Student validation schemas
export const createStudentSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX").optional(),
  rg: z.string().optional(),
  belt: z.string().optional(),
  belt_degree: z.number().int().min(1).max(10).optional(),
  address: z.string().optional(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone deve estar no formato (XX) XXXXX-XXXX").optional(),
  email: z.string().email("Email inválido").optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  medical_observations: z.string().optional(),
  monthly_fee: z.number().positive("Mensalidade deve ser positiva").optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

// Teacher validation schemas
export const createTeacherSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX").optional(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone deve estar no formato (XX) XXXXX-XXXX").optional(),
  email: z.string().email("Email inválido").optional(),
  belt: z.string().optional(),
  belt_degree: z.number().int().min(1).max(10).optional(),
  specialties: z.array(z.string()).optional(),
  hourly_rate: z.number().positive("Valor por hora deve ser positivo").optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

// Class validation schemas
export const createClassSchema = z.object({
  name: z.string().min(2, "Nome da aula deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  teacher_id: z.string().uuid("ID do professor deve ser um UUID válido").optional(),
  day_of_week: z.number().int().min(0).max(6, "Dia da semana deve ser entre 0 (domingo) e 6 (sábado)"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  max_students: z.number().int().positive("Número máximo de alunos deve ser positivo").optional(),
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
  discount: z.number().min(0, "Desconto não pode ser negativo").optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  payment_method: z.enum(["cash", "card", "pix", "bank_transfer"]).optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  discount: z.number().min(0, "Desconto não pode ser negativo").optional(),
  late_fee: z.number().min(0, "Multa não pode ser negativa").optional(),
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

export function validateCPF(cpf: string): boolean {
  // Remove formatting
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check for repeated digits
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  
  if (digit1 !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  
  return digit2 === parseInt(cleanCPF[10]);
}

export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[^\d]/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
} 