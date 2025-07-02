import { prisma } from "../config/prisma.js";
import { validateUUID } from "../utils/validation.js";
import { z } from "zod";

// Belt promotion validation schema
export const createBeltPromotionSchema = z.object({
  student_id: z.string().uuid("ID do aluno deve ser um UUID válido"),
  new_belt: z.string().min(1, "Nova faixa é obrigatória"),
  new_degree: z.number().int().min(0).max(10, "Grau deve estar entre 0 e 10"),
  promotion_type: z.enum(["regular", "skip_degree", "honorary", "correction"]).optional(),
  requirements_met: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
  certificate_url: z.string().url("URL do certificado deve ser válida").optional(),
  promotion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
});

export class BeltController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      // Build where clause
      const where: Prisma.BeltPromotionWhereInput = {};

      // Add search filter
      if (pagination.search) {
        where.OR = [
          { student: { full_name: { contains: pagination.search, mode: 'insensitive' } } },
          { student: { cpf: { contains: pagination.search, mode: 'insensitive' } } },
          { new_belt: { contains: pagination.search, mode: 'insensitive' } }
        ];
      }

      // Add belt filter
      if (queryParams.belt) {
        where.new_belt = queryParams.belt;
      }

      // Add promotion type filter
      if (queryParams.promotion_type) {
        where.promotion_type = queryParams.promotion_type as any;
      }

      // Build orderBy
      const orderBy: Prisma.BeltPromotionOrderByWithRelationInput = {};
      const sortField = pagination.sort || 'promotion_date';
      const sortOrder = pagination.order || 'desc';
      orderBy[sortField as keyof Prisma.BeltPromotionOrderByWithRelationInput] = sortOrder;

      // Execute queries in parallel
      const [promotions, totalCount] = await Promise.all([
        prisma.beltPromotion.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy,
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                cpf: true,
                status: true,
                enrollment_date: true
              }
            },
            promoted_by_user: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          }
        }),
        prisma.beltPromotion.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: promotions,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / pagination.limit)
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get belt promotions error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro interno do servidor"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  async getById(request: Request, id: string): Promise<Response> {
    try {
      if (!validateUUID(id)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ID inválido"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const promotion = await prisma.beltPromotion.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              cpf: true,
              belt: true,
              belt_degree: true,
              status: true,
              enrollment_date: true
            }
          },
          promoted_by_user: {
            select: {
              id: true,
              username: true,
              role: true,
              teacher: {
                select: {
                  full_name: true,
                  belt: true,
                  belt_degree: true
                }
              }
            }
          }
        }
      });

      if (!promotion) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Promoção não encontrada"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: promotion
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get belt promotion by ID error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro interno do servidor"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  async promoteStudent(request: Request, promotedBy: string): Promise<Response> {
    try {
      const body = await request.json();

      // Validate input
      const validation = createBeltPromotionSchema.safeParse(body);
      if (!validation.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Dados inválidos",
            details: validation.error.errors
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const promotionData = validation.data;

      // Check if student exists and is active
      const student = await prisma.student.findUnique({
        where: { id: promotionData.student_id },
        select: { 
          id: true, 
          status: true, 
          full_name: true,
          belt: true,
          belt_degree: true
        }
      });

      if (!student) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Aluno não encontrado"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      if (student.status !== 'active') {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Aluno deve estar ativo para ser promovido"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // For now, just update the student's belt until we migrate the schema
      const updatedStudent = await prisma.student.update({
        where: { id: promotionData.student_id },
        data: {
          belt: promotionData.new_belt,
          belt_degree: promotionData.new_degree
        },
        select: {
          id: true,
          full_name: true,
          belt: true,
          belt_degree: true,
          email: true,
          phone: true
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            student: updatedStudent,
            promotion: {
              previous_belt: student.belt,
              previous_degree: student.belt_degree,
              new_belt: promotionData.new_belt,
              new_degree: promotionData.new_degree,
              promotion_date: new Date().toISOString(),
              notes: promotionData.notes
            }
          },
          message: `${student.full_name} foi promovido(a) para ${promotionData.new_belt} ${promotionData.new_degree}º grau com sucesso`
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Promote student error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro interno do servidor"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  async getStudentBeltProgress(request: Request, studentId: string): Promise<Response> {
    try {
      if (!validateUUID(studentId)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ID do aluno inválido"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          full_name: true,
          belt: true,
          belt_degree: true,
          enrollment_date: true,
          status: true
        }
      });

      if (!student) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Aluno não encontrado"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Calculate time since enrollment
      const enrollmentDate = student.enrollment_date ? new Date(student.enrollment_date) : null;
      const daysSinceEnrollment = enrollmentDate 
        ? Math.floor((new Date().getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            student: {
              id: student.id,
              full_name: student.full_name,
              current_belt: student.belt,
              current_degree: student.belt_degree,
              enrollment_date: student.enrollment_date,
              status: student.status
            },
            progress: {
              days_since_enrollment: daysSinceEnrollment,
              current_level: `${student.belt || 'Sem faixa'} - ${student.belt_degree || 0}º grau`
            },
            message: "Histórico completo de promoções estará disponível após migração do banco de dados"
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get student belt progress error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro interno do servidor"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  async getBeltOverview(request: Request): Promise<Response> {
    try {
      // Get current belt distribution
      const beltDistribution = await prisma.student.groupBy({
        by: ['belt', 'belt_degree'],
        _count: { id: true },
        where: { status: 'active' },
        orderBy: [
          { belt: 'asc' },
          { belt_degree: 'asc' }
        ]
      });

      const totalActiveStudents = beltDistribution.reduce((sum, item) => sum + item._count.id, 0);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            belt_distribution: beltDistribution.map(item => ({
              belt: item.belt || 'Sem faixa',
              degree: item.belt_degree || 0,
              count: item._count.id,
              percentage: totalActiveStudents > 0 ? ((item._count.id / totalActiveStudents) * 100).toFixed(1) : '0'
            })),
            summary: {
              total_active_students: totalActiveStudents,
              unique_belt_levels: beltDistribution.length
            },
            message: "Estatísticas detalhadas de promoções estarão disponíveis após migração do banco de dados"
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get belt overview error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro interno do servidor"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
} 