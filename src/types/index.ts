export interface Student {
  id: string;
  full_name: string;
  birth_date: string;
  cpf?: string;
  rg?: string;
  belt?: string;
  belt_degree: number;
  address?: string;
  phone?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  medical_observations?: string;
  photo_url?: string;
  enrollment_date: string;
  monthly_fee?: number | null;
  status: 'active' | 'inactive' | 'suspended';
  username?: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  birth_date?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  belt?: string;
  belt_degree?: number | null;
  specialties?: string[];
  hourly_rate?: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string;
  end_time: string;
  max_students: number;
  belt_requirement?: string;
  age_group?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StudentClass {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Checkin {
  id: string;
  student_id: string;
  class_id?: string;
  checkin_date: string;
  checkin_time: string;
  method: 'manual' | 'qr_code' | 'app';
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_method?: 'cash' | 'card' | 'pix' | 'bank_transfer';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  reference_month: string;
  discount: number;
  late_fee: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  password_hash: string;
  role: 'admin' | 'teacher' | 'receptionist' | 'student';
  teacher_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Request/Response types
export interface CreateStudentRequest {
  full_name: string;
  birth_date: string;
  cpf?: string;
  rg?: string;
  belt?: string;
  belt_degree?: number | null;
  address?: string;
  phone?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  medical_observations?: string;
  monthly_fee?: number | null;
}

export interface CreateTeacherRequest {
  full_name: string;
  birth_date?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  belt?: string;
  belt_degree?: number | null;
  specialties?: string[];
  hourly_rate?: number | null;
}

export interface CreateClassRequest {
  name: string;
  description?: string;
  teacher_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_students?: number | null;
  belt_requirement?: string;
  age_group?: string;
}

export interface CreateCheckinRequest {
  student_id: string;
  class_id?: string;
  method?: 'manual' | 'qr_code' | 'app';
  notes?: string;
}

export interface CreatePaymentRequest {
  student_id: string;
  amount: number;
  due_date: string;
  reference_month: string;
  discount?: number | null;
  notes?: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'> | Omit<Student, 'password_hash'>;
}

export interface StudentAuthResponse {
  token: string;
  student: Omit<Student, 'password_hash'>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 