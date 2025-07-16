import { prisma } from "../config/prisma.js";
import { validateUUID, paginationSchema } from "../utils/validation.js";
import { z } from "zod";
import { Prisma } from "../generated/prisma/index.js";

// Belt promotion validation schema
export const createBeltPromotionSchema = z.object({
  student_id: z.string().uuid("ID do aluno deve ser um UUID válido"),
  new_belt: z.string().min(1, "Nova faixa é obrigatória"),
  new_degree: z.number().int().min(0).max(10, "Grau deve estar entre 0 e 10"),
  promotion_type: z.enum(["regular", "skip_degree", "honorary", "correction"]).optional(),
  requirements_met: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
  certificate_url: z.string().url("URL do certificado deve ser válida").optional().or(z.literal("")).or(z.null()),
  promotion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
});

// Update belt promotion validation schema
export const updateBeltPromotionSchema = z.object({
  new_belt: z.string().min(1, "Nova faixa é obrigatória").optional(),
  new_degree: z.number().int().min(0).max(10, "Grau deve estar entre 0 e 10").optional(),
  promotion_type: z.enum(["regular", "skip_degree", "honorary", "correction"]).optional(),
  requirements_met: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
  certificate_url: z.string().url("URL do certificado deve ser válida").optional().or(z.literal("")).or(z.null()),
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

      // Use transaction to update student and create promotion record
      const result = await prisma.$transaction(async (tx) => {
        // Create promotion record
        const promotion = await tx.beltPromotion.create({
          data: {
            student_id: promotionData.student_id,
            promoted_by: promotedBy,
            previous_belt: student.belt,
            previous_degree: student.belt_degree,
            new_belt: promotionData.new_belt,
            new_degree: promotionData.new_degree,
            promotion_date: promotionData.promotion_date ? new Date(promotionData.promotion_date) : new Date(),
            promotion_type: promotionData.promotion_type || 'regular',
            requirements_met: promotionData.requirements_met as any,
            notes: promotionData.notes || null,
            certificate_url: promotionData.certificate_url === "" ? null : (promotionData.certificate_url || null)
          },
          include: {
            promoted_by_user: {
              select: {
                username: true,
                role: true,
                teacher: {
                  select: {
                    full_name: true
                  }
                }
              }
            }
          }
        });

        // Update student's current belt
        const updatedStudent = await tx.student.update({
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

        return { promotion, updatedStudent };
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            student: result.updatedStudent,
            promotion: {
              id: result.promotion.id,
              previous_belt: result.promotion.previous_belt,
              previous_degree: result.promotion.previous_degree,
              new_belt: result.promotion.new_belt,
              new_degree: result.promotion.new_degree,
              promotion_date: result.promotion.promotion_date,
              promotion_type: result.promotion.promotion_type,
              requirements_met: result.promotion.requirements_met,
              notes: result.promotion.notes,
              certificate_url: result.promotion.certificate_url,
              promoted_by: (result.promotion as any).promoted_by_user.teacher?.full_name || (result.promotion as any).promoted_by_user.username
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

  async updateBeltPromotion(request: Request, id: string): Promise<Response> {
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

      const body = await request.json();
      const validation = updateBeltPromotionSchema.safeParse(body);

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

      const updateData = validation.data;

      const promotion = await prisma.beltPromotion.findUnique({
        where: { id },
        select: {
          id: true,
          student_id: true,
          previous_belt: true,
          previous_degree: true,
          new_belt: true,
          new_degree: true,
          promotion_date: true,
          promotion_type: true,
          requirements_met: true,
          notes: true,
          certificate_url: true,
          created_at: true,
          updated_at: true
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

             // Build update data with proper type handling
       const updateDataToSave: Prisma.BeltPromotionUpdateInput = {};
       
       if (updateData.new_belt !== undefined) updateDataToSave.new_belt = updateData.new_belt;
       if (updateData.new_degree !== undefined) updateDataToSave.new_degree = updateData.new_degree;
       if (updateData.promotion_type !== undefined) updateDataToSave.promotion_type = updateData.promotion_type;
       if (updateData.requirements_met !== undefined) updateDataToSave.requirements_met = updateData.requirements_met as any;
       if (updateData.notes !== undefined) updateDataToSave.notes = updateData.notes;
       if (updateData.certificate_url !== undefined) {
         // Handle empty string and null values
         updateDataToSave.certificate_url = updateData.certificate_url === "" ? null : updateData.certificate_url;
       }
       if (updateData.promotion_date !== undefined) updateDataToSave.promotion_date = new Date(updateData.promotion_date);
       
       updateDataToSave.updated_at = new Date();

       // Use transaction to update promotion and potentially update student's current belt
       const result = await prisma.$transaction(async (tx) => {
         // Update the promotion
         const updatedPromotion = await tx.beltPromotion.update({
           where: { id },
           data: updateDataToSave,
           include: {
             student: {
               select: {
                 id: true,
                 full_name: true,
                 belt: true,
                 belt_degree: true,
                 email: true,
                 phone: true
               }
             },
             promoted_by_user: {
               select: {
                 id: true,
                 username: true,
                 role: true,
                 teacher: {
                   select: {
                     full_name: true
                   }
                 }
               }
             }
           }
         });

         // Check if this is the most recent promotion for the student
         const mostRecentPromotion = await tx.beltPromotion.findFirst({
           where: { student_id: promotion.student_id },
           orderBy: { promotion_date: 'desc' }
         });

         // If this is the most recent promotion, update the student's current belt
         if (mostRecentPromotion && mostRecentPromotion.id === id) {
           await tx.student.update({
             where: { id: promotion.student_id },
             data: {
               belt: updatedPromotion.new_belt,
               belt_degree: updatedPromotion.new_degree
             }
           });
         }

         return updatedPromotion;
       });

       const updatedPromotion = result;

       return new Response(
         JSON.stringify({
           success: true,
           data: {
             id: updatedPromotion.id,
             student: (updatedPromotion as any).student,
             previous_belt: updatedPromotion.previous_belt,
             previous_degree: updatedPromotion.previous_degree,
             new_belt: updatedPromotion.new_belt,
             new_degree: updatedPromotion.new_degree,
             promotion_date: updatedPromotion.promotion_date,
             promotion_type: updatedPromotion.promotion_type,
             requirements_met: updatedPromotion.requirements_met,
             notes: updatedPromotion.notes,
             certificate_url: updatedPromotion.certificate_url,
             created_at: updatedPromotion.created_at,
             updated_at: updatedPromotion.updated_at,
             promoted_by: (updatedPromotion as any).promoted_by_user?.teacher?.full_name || (updatedPromotion as any).promoted_by_user?.username
           },
           message: "Promoção de faixa atualizada com sucesso"
         }),
         {
           status: 200,
           headers: { "Content-Type": "application/json" }
         }
       );

    } catch (error) {
      console.error("Update belt promotion error:", error);
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

  async deleteBeltPromotion(request: Request, id: string): Promise<Response> {
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

      // Check if promotion exists
      const promotion = await prisma.beltPromotion.findUnique({
        where: { id },
        select: {
          id: true,
          student_id: true,
          new_belt: true,
          new_degree: true,
          promotion_date: true,
          student: {
            select: {
              id: true,
              full_name: true,
              belt: true,
              belt_degree: true
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

      // Use transaction to delete promotion and potentially update student's current belt
      await prisma.$transaction(async (tx) => {
        // Delete the promotion
        await tx.beltPromotion.delete({
          where: { id }
        });

        // Check if this was the most recent promotion for the student
        const mostRecentPromotion = await tx.beltPromotion.findFirst({
          where: { student_id: promotion.student_id },
          orderBy: { promotion_date: 'desc' }
        });

        // If this was the most recent promotion, update the student's current belt
        if (!mostRecentPromotion) {
          // No more promotions, reset student to no belt
          await tx.student.update({
            where: { id: promotion.student_id },
            data: {
              belt: null,
              belt_degree: null
            }
          });
        } else {
          // Update student to the most recent promotion
          await tx.student.update({
            where: { id: promotion.student_id },
            data: {
              belt: mostRecentPromotion.new_belt,
              belt_degree: mostRecentPromotion.new_degree
            }
          });
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Promoção de ${promotion.student.full_name} para ${promotion.new_belt} ${promotion.new_degree}º grau foi excluída com sucesso`
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Delete belt promotion error:", error);
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

      // Get student with promotion history
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          full_name: true,
          belt: true,
          belt_degree: true,
          enrollment_date: true,
          status: true,
          belt_promotions: {
            orderBy: {
              promotion_date: 'desc'
            },
            include: {
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
          }
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

      // Calculate time at current belt
      const lastPromotion = student.belt_promotions[0]; // Most recent promotion
      const timeAtCurrentBelt = lastPromotion 
        ? Math.floor((new Date().getTime() - new Date(lastPromotion.promotion_date).getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceEnrollment;

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
              current_level: `${student.belt || 'Sem faixa'} - ${student.belt_degree || 0}º grau`,
              total_promotions: student.belt_promotions.length,
              last_promotion_date: lastPromotion?.promotion_date || null,
              time_at_current_belt: timeAtCurrentBelt
            },
            promotion_history: student.belt_promotions.map(promotion => ({
              id: promotion.id,
              previous_belt: promotion.previous_belt,
              previous_degree: promotion.previous_degree,
              new_belt: promotion.new_belt,
              new_degree: promotion.new_degree,
              promotion_date: promotion.promotion_date,
              promotion_type: promotion.promotion_type,
              requirements_met: promotion.requirements_met,
              notes: promotion.notes,
              certificate_url: promotion.certificate_url,
              promoted_by_user: {
                id: promotion.promoted_by_user.id,
                username: promotion.promoted_by_user.username,
                role: promotion.promoted_by_user.role,
                teacher_name: promotion.promoted_by_user.teacher?.full_name || null,
                teacher_belt: promotion.promoted_by_user.teacher?.belt || null,
                teacher_degree: promotion.promoted_by_user.teacher?.belt_degree || null
              }
            }))
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

      // Get recent promotions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPromotions = await prisma.beltPromotion.findMany({
        where: {
          promotion_date: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: {
          promotion_date: 'desc'
        },
        take: 10,
        include: {
          student: {
            select: {
              full_name: true
            }
          },
          promoted_by_user: {
            select: {
              username: true,
              teacher: {
                select: {
                  full_name: true
                }
              }
            }
          }
        }
      });

      // Get promotions count for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const promotionsThisMonth = await prisma.beltPromotion.count({
        where: {
          promotion_date: {
            gte: startOfMonth
          }
        }
      });

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
              unique_belt_levels: beltDistribution.length,
              recent_promotions: recentPromotions.length,
              promotions_this_month: promotionsThisMonth
            },
            recent_promotions: recentPromotions.map(promotion => ({
              student_name: promotion.student.full_name,
              previous_belt: promotion.previous_belt,
              previous_degree: promotion.previous_degree,
              new_belt: promotion.new_belt,
              new_degree: promotion.new_degree,
              promotion_date: promotion.promotion_date,
              promotion_type: promotion.promotion_type,
              promoted_by: promotion.promoted_by_user.teacher?.full_name || promotion.promoted_by_user.username
            }))
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