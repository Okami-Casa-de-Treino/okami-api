import { prisma } from "../config/prisma.js";
import { createTeacherSchema, updateTeacherSchema, paginationSchema, validateUUID } from "../utils/validation.js";
import type { Prisma } from "../generated/prisma/index.js";

export class TeacherController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      // Build where clause
      const where: Prisma.TeacherWhereInput = {};

      // Add search filter
      if (pagination.search) {
        where.OR = [
          { full_name: { contains: pagination.search, mode: 'insensitive' } },
          { email: { contains: pagination.search, mode: 'insensitive' } },
          { cpf: { contains: pagination.search, mode: 'insensitive' } }
        ];
      }

      // Add status filter
      if (pagination.status) {
        where.status = pagination.status as any;
      }

      // Build orderBy
      const orderBy: Prisma.TeacherOrderByWithRelationInput = {};
      const sortField = pagination.sort || 'created_at';
      const sortOrder = pagination.order || 'desc';
      orderBy[sortField as keyof Prisma.TeacherOrderByWithRelationInput] = sortOrder;

      // Execute queries in parallel
      const [teachers, totalCount] = await Promise.all([
        prisma.teacher.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy,
          select: {
            id: true,
            full_name: true,
            birth_date: true,
            cpf: true,
            phone: true,
            email: true,
            belt: true,
            belt_degree: true,
            specialties: true,
            hourly_rate: true,
            status: true,
            created_at: true,
            updated_at: true,
            _count: {
              select: {
                classes: true
              }
            }
          }
        }),
        prisma.teacher.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: teachers,
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
      console.error("Get teachers error:", error);
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

      const teacher = await prisma.teacher.findUnique({
        where: { id },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
              description: true,
              days_of_week: true,
              start_time: true,
              end_time: true,
              max_students: true,
              status: true,
              _count: {
                select: {
                  student_classes: {
                    where: { status: 'active' }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              classes: true
            }
          }
        }
      });

      if (!teacher) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Professor não encontrado"
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
          data: teacher
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get teacher by ID error:", error);
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

  async create(request: Request): Promise<Response> {
    try {
      const body = await request.json();

      const validation = createTeacherSchema.safeParse(body);
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

      const teacherData = validation.data;

      try {
        const newTeacher = await prisma.teacher.create({
          data: {
            full_name: teacherData.full_name,
            birth_date: teacherData.birth_date ? new Date(teacherData.birth_date) : null,
            cpf: teacherData.cpf,
            phone: teacherData.phone,
            email: teacherData.email,
            belt: teacherData.belt,
            belt_degree: teacherData.belt_degree,
            specialties: teacherData.specialties,
            hourly_rate: teacherData.hourly_rate
          },
          select: {
            id: true,
            full_name: true,
            birth_date: true,
            cpf: true,
            phone: true,
            email: true,
            belt: true,
            belt_degree: true,
            specialties: true,
            hourly_rate: true,
            status: true,
            created_at: true,
            updated_at: true
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: newTeacher,
            message: "Professor criado com sucesso"
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        if (error.code === 'P2002') {
          const field = error.meta?.target?.[0];
          const message = field === 'cpf' ? 'CPF já cadastrado' : 
                         field === 'email' ? 'Email já cadastrado' : 
                         field === 'phone' ? 'Telefone já cadastrado' :
                         'Dados já cadastrados';
          
          return new Response(
            JSON.stringify({
              success: false,
              error: message
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
        throw error;
      }

    } catch (error) {
      console.error("Create teacher error:", error);
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

  async update(request: Request, id: string): Promise<Response> {
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
      const validation = updateTeacherSchema.safeParse(body);
      
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

      const teacherData = validation.data;

      // Build update data
      const updateData: Prisma.TeacherUpdateInput = {};
      
      if (teacherData.full_name !== undefined) updateData.full_name = teacherData.full_name;
      if (teacherData.birth_date !== undefined) updateData.birth_date = teacherData.birth_date ? new Date(teacherData.birth_date) : null;
      if (teacherData.cpf !== undefined) updateData.cpf = teacherData.cpf;
      if (teacherData.phone !== undefined) updateData.phone = teacherData.phone;
      if (teacherData.email !== undefined) updateData.email = teacherData.email;
      if (teacherData.belt !== undefined) updateData.belt = teacherData.belt;
      if (teacherData.belt_degree !== undefined) updateData.belt_degree = teacherData.belt_degree;
      if (teacherData.specialties !== undefined) updateData.specialties = teacherData.specialties;
      if (teacherData.hourly_rate !== undefined) updateData.hourly_rate = teacherData.hourly_rate;

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Nenhum campo para atualizar"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      try {
        const updatedTeacher = await prisma.teacher.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            full_name: true,
            birth_date: true,
            cpf: true,
            phone: true,
            email: true,
            belt: true,
            belt_degree: true,
            specialties: true,
            hourly_rate: true,
            status: true,
            created_at: true,
            updated_at: true
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: updatedTeacher,
            message: "Professor atualizado com sucesso"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        if (error.code === 'P2002') {
          const field = error.meta?.target?.[0];
          const message = field === 'cpf' ? 'CPF já cadastrado para outro professor' : 
                         field === 'email' ? 'Email já cadastrado para outro professor' : 
                         field === 'phone' ? 'Telefone já cadastrado para outro professor' :
                         'Dados já cadastrados para outro professor';
          
          return new Response(
            JSON.stringify({
              success: false,
              error: message
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        if (error.code === 'P2025') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Professor não encontrado"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        throw error;
      }

    } catch (error) {
      console.error("Update teacher error:", error);
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

  async delete(request: Request, id: string): Promise<Response> {
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

      try {
        // Check if teacher exists and has related records
        const teacher = await prisma.teacher.findUnique({
          where: { id },
          include: {
            classes: { take: 1 },
            users: { take: 1 }
          }
        });

        if (!teacher) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Professor não encontrado"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Check for related records
        const hasRelatedRecords = teacher.classes.length > 0 || teacher.users.length > 0;

        if (hasRelatedRecords) {
          // Soft delete by setting status to inactive
          await prisma.teacher.update({
            where: { id },
            data: { status: 'inactive' }
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: "Professor desativado com sucesso (possui registros relacionados)"
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        } else {
          // Hard delete if no related records
          await prisma.teacher.delete({
            where: { id }
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: "Professor removido com sucesso"
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

      } catch (error: any) {
        if (error.code === 'P2025') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Professor não encontrado"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
        throw error;
      }

    } catch (error) {
      console.error("Delete teacher error:", error);
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

  async getTeacherClasses(request: Request, id: string): Promise<Response> {
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

      const classes = await prisma.class.findMany({
        where: { teacher_id: id },
        include: {
          _count: {
            select: {
              student_classes: {
                where: { status: 'active' }
              }
            }
          }
        },
                  orderBy: [
            { days_of_week: 'asc' },
          { start_time: 'asc' }
        ]
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: classes
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get teacher classes error:", error);
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