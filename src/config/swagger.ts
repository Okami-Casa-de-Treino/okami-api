import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Okami Gym Management API',
    version: '1.0.0',
    description: 'Sistema completo de gestão de academia/escola de artes marciais',
    contact: {
      name: 'API Support',
      email: 'support@okami-gym.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.okami-gym.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtido através do endpoint /api/auth/login',
      },
    },
    schemas: {
      // Error Response
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Erro interno do servidor' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
      
      // Success Response
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operação realizada com sucesso' },
        },
      },

      // Auth
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' },
        },
      },
      
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },

      // User
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string', example: 'admin' },
          email: { type: 'string', format: 'email', example: 'admin@okami-gym.com' },
          role: { type: 'string', enum: ['admin', 'teacher', 'receptionist'] },
          teacher_id: { type: 'string', format: 'uuid', nullable: true },
          status: { type: 'string', enum: ['active', 'inactive'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },

      // Student
      Student: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          full_name: { type: 'string', example: 'João Silva' },
          birth_date: { type: 'string', format: 'date', example: '1995-05-15' },
          cpf: { type: 'string', example: '123.456.789-00' },
          rg: { type: 'string', example: '12.345.678-9' },
          belt: { type: 'string', example: 'Faixa Branca' },
          belt_degree: { type: 'integer', example: 1 },
          address: { type: 'string', example: 'Rua das Flores, 123' },
          phone: { type: 'string', example: '(11) 99999-9999' },
          email: { type: 'string', format: 'email', example: 'joao@email.com' },
          emergency_contact_name: { type: 'string', example: 'Maria Silva' },
          emergency_contact_phone: { type: 'string', example: '(11) 88888-8888' },
          emergency_contact_relationship: { type: 'string', example: 'Mãe' },
          medical_observations: { type: 'string', example: 'Alergia a amendoim' },
          photo_url: { type: 'string', format: 'url' },
          enrollment_date: { type: 'string', format: 'date' },
          monthly_fee: { type: 'number', format: 'decimal', example: 150.00 },
          status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },

      CreateStudentRequest: {
        type: 'object',
        required: ['full_name', 'birth_date'],
        properties: {
          full_name: { type: 'string', example: 'João Silva' },
          birth_date: { type: 'string', format: 'date', example: '1995-05-15' },
          cpf: { type: 'string', example: '123.456.789-00' },
          rg: { type: 'string', example: '12.345.678-9' },
          belt: { type: 'string', example: 'Faixa Branca' },
          belt_degree: { type: 'integer', example: 1 },
          address: { type: 'string', example: 'Rua das Flores, 123' },
          phone: { type: 'string', example: '(11) 99999-9999' },
          email: { type: 'string', format: 'email', example: 'joao@email.com' },
          emergency_contact_name: { type: 'string', example: 'Maria Silva' },
          emergency_contact_phone: { type: 'string', example: '(11) 88888-8888' },
          emergency_contact_relationship: { type: 'string', example: 'Mãe' },
          medical_observations: { type: 'string', example: 'Alergia a amendoim' },
          monthly_fee: { type: 'number', format: 'decimal', example: 150.00 },
        },
      },

      // Teacher
      Teacher: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          full_name: { type: 'string', example: 'Sensei Takeshi' },
          birth_date: { type: 'string', format: 'date', example: '1980-03-20' },
          cpf: { type: 'string', example: '987.654.321-00' },
          phone: { type: 'string', example: '(11) 77777-7777' },
          email: { type: 'string', format: 'email', example: 'sensei@okami-gym.com' },
          belt: { type: 'string', example: 'Faixa Preta' },
          belt_degree: { type: 'integer', example: 5 },
          specialties: { type: 'array', items: { type: 'string' }, example: ['Karate', 'Jiu-Jitsu'] },
          hourly_rate: { type: 'number', format: 'decimal', example: 80.00 },
          status: { type: 'string', enum: ['active', 'inactive'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },

      CreateTeacherRequest: {
        type: 'object',
        required: ['full_name'],
        properties: {
          full_name: { type: 'string', example: 'Sensei Takeshi' },
          birth_date: { type: 'string', format: 'date', example: '1980-03-20' },
          cpf: { type: 'string', example: '987.654.321-00' },
          phone: { type: 'string', example: '(11) 77777-7777' },
          email: { type: 'string', format: 'email', example: 'sensei@okami-gym.com' },
          belt: { type: 'string', example: 'Faixa Preta' },
          belt_degree: { type: 'integer', example: 5 },
          specialties: { type: 'array', items: { type: 'string' }, example: ['Karate', 'Jiu-Jitsu'] },
          hourly_rate: { type: 'number', format: 'decimal', example: 80.00 },
        },
      },

      // Class
      Class: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Karate Infantil' },
          description: { type: 'string', example: 'Aula de karate para crianças de 6 a 12 anos' },
          teacher_id: { type: 'string', format: 'uuid' },
          day_of_week: { type: 'integer', minimum: 0, maximum: 6, example: 1, description: '0=Domingo, 1=Segunda, ..., 6=Sábado' },
          start_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', example: '18:00' },
          end_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', example: '19:00' },
          max_students: { type: 'integer', example: 20 },
          belt_requirement: { type: 'string', example: 'Faixa Branca ou superior' },
          age_group: { type: 'string', example: 'Infantil' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },

      CreateClassRequest: {
        type: 'object',
        required: ['name', 'day_of_week', 'start_time', 'end_time'],
        properties: {
          name: { type: 'string', example: 'Karate Infantil' },
          description: { type: 'string', example: 'Aula de karate para crianças de 6 a 12 anos' },
          teacher_id: { type: 'string', format: 'uuid' },
          day_of_week: { type: 'integer', minimum: 0, maximum: 6, example: 1 },
          start_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', example: '18:00' },
          end_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', example: '19:00' },
          max_students: { type: 'integer', example: 20 },
          belt_requirement: { type: 'string', example: 'Faixa Branca ou superior' },
          age_group: { type: 'string', example: 'Infantil' },
        },
      },

      // Checkin
      Checkin: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          student_id: { type: 'string', format: 'uuid' },
          class_id: { type: 'string', format: 'uuid' },
          checkin_date: { type: 'string', format: 'date' },
          checkin_time: { type: 'string', format: 'date-time' },
          method: { type: 'string', enum: ['manual', 'qr_code', 'app'] },
          notes: { type: 'string', example: 'Check-in realizado com sucesso' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },

      CreateCheckinRequest: {
        type: 'object',
        required: ['student_id'],
        properties: {
          student_id: { type: 'string', format: 'uuid' },
          class_id: { type: 'string', format: 'uuid' },
          method: { type: 'string', enum: ['manual', 'qr_code', 'app'], default: 'manual' },
          notes: { type: 'string', example: 'Check-in realizado com sucesso' },
        },
      },

      // Payment
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          student_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', format: 'decimal', example: 150.00 },
          due_date: { type: 'string', format: 'date', example: '2024-01-31' },
          payment_date: { type: 'string', format: 'date', example: '2024-01-30' },
          payment_method: { type: 'string', enum: ['cash', 'card', 'pix', 'bank_transfer'] },
          status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] },
          reference_month: { type: 'string', format: 'date', example: '2024-01-01' },
          discount: { type: 'number', format: 'decimal', example: 0.00 },
          late_fee: { type: 'number', format: 'decimal', example: 0.00 },
          notes: { type: 'string', example: 'Pagamento da mensalidade de janeiro' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },

      CreatePaymentRequest: {
        type: 'object',
        required: ['student_id', 'amount', 'due_date', 'reference_month'],
        properties: {
          student_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', format: 'decimal', example: 150.00 },
          due_date: { type: 'string', format: 'date', example: '2024-01-31' },
          reference_month: { type: 'string', format: 'date', example: '2024-01-01' },
          discount: { type: 'number', format: 'decimal', example: 0.00 },
          notes: { type: 'string', example: 'Pagamento da mensalidade de janeiro' },
        },
      },

      // Dashboard
      DashboardData: {
        type: 'object',
        properties: {
          totalStudents: { type: 'integer', example: 150 },
          totalTeachers: { type: 'integer', example: 8 },
          totalClasses: { type: 'integer', example: 25 },
          todayCheckins: { type: 'integer', example: 45 },
          pendingPayments: { type: 'integer', example: 12 },
          monthlyRevenue: { type: 'number', format: 'decimal', example: 15000.00 },
        },
      },

      // Pagination
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { type: 'object' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 10 },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/docs/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options); 