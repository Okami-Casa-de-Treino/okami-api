import { prisma } from "../config/prisma.js";
import { createCheckinSchema, paginationSchema, validateUUID } from "../utils/validation.js";
import type { Prisma } from "../generated/prisma/index.js";

export class CheckinController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      // Build where clause
      const where: Prisma.CheckinWhereInput = {};

      // Add search filter
      if (pagination.search) {
        where.OR = [
          { student: { full_name: { contains: pagination.search, mode: 'insensitive' } } },
          { student: { cpf: { contains: pagination.search, mode: 'insensitive' } } },
          { class: { name: { contains: pagination.search, mode: 'insensitive' } } }
        ];
      }

      // Build orderBy
      const orderBy: Prisma.CheckinOrderByWithRelationInput = {};
      const sortField = pagination.sort || 'checkin_date';
      const sortOrder = pagination.order || 'desc';
      orderBy[sortField as keyof Prisma.CheckinOrderByWithRelationInput] = sortOrder;

      // Execute queries in parallel
      const [checkins, totalCount] = await Promise.all([
        prisma.checkin.findMany({
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
                belt: true,
                belt_degree: true,
                status: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                day_of_week: true,
                start_time: true,
                end_time: true,
                teacher: {
                  select: {
                    id: true,
                    full_name: true
                  }
                }
              }
            }
          }
        }),
        prisma.checkin.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: checkins,
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
      console.error("Get checkins error:", error);
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

      const checkin = await prisma.checkin.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              belt: true,
              belt_degree: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              day_of_week: true,
              start_time: true,
              end_time: true,
              teacher: {
                select: {
                  id: true,
                  full_name: true,
                  belt: true,
                  belt_degree: true
                }
              }
            }
          }
        }
      });

      if (!checkin) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Check-in não encontrado"
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
          data: checkin
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get checkin by ID error:", error);
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

      const validation = createCheckinSchema.safeParse(body);
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

      const checkinData = validation.data;

      try {
        // Check if student exists and is active
        const student = await prisma.student.findUnique({
          where: { id: checkinData.student_id },
          select: { id: true, status: true, full_name: true }
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
              error: "Aluno não está ativo"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Check if class exists and is active (if class_id is provided)
        if (checkinData.class_id) {
          const classData = await prisma.class.findUnique({
            where: { id: checkinData.class_id },
            select: { id: true, status: true, name: true }
          });

          if (!classData) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Turma não encontrada"
              }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" }
              }
            );
          }

          if (classData.status !== 'active') {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Turma não está ativa"
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" }
              }
            );
          }

          // Check if student is enrolled in this class
          const enrollment = await prisma.studentClass.findFirst({
            where: {
              student_id: checkinData.student_id,
              class_id: checkinData.class_id,
              status: 'active'
            }
          });

          if (!enrollment) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Aluno não está matriculado nesta turma"
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
        }

        // Check if student already checked in today for this class
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingCheckin = await prisma.checkin.findFirst({
          where: {
            student_id: checkinData.student_id,
            class_id: checkinData.class_id || null,
            checkin_date: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (existingCheckin) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aluno já fez check-in hoje" + (checkinData.class_id ? " nesta turma" : "")
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const newCheckin = await prisma.checkin.create({
          data: {
            student_id: checkinData.student_id,
            class_id: checkinData.class_id || null,
            method: checkinData.method || 'manual',
            notes: checkinData.notes
          },
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                belt: true,
                belt_degree: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                day_of_week: true,
                start_time: true,
                end_time: true
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: newCheckin,
            message: "Check-in realizado com sucesso"
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        if (error.code === 'P2003') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aluno ou turma não encontrados"
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
      console.error("Create checkin error:", error);
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
        await prisma.checkin.delete({
          where: { id }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Check-in removido com sucesso"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        if (error.code === 'P2025') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Check-in não encontrado"
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
      console.error("Delete checkin error:", error);
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

  async getStudentCheckins(request: Request, studentId: string): Promise<Response> {
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

      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      const where: Prisma.CheckinWhereInput = {
        student_id: studentId
      };

      // Add date range filter if provided
      const startDate = queryParams.start_date;
      const endDate = queryParams.end_date;
      
      if (startDate || endDate) {
        where.checkin_date = {};
        if (startDate) where.checkin_date.gte = new Date(startDate);
        if (endDate) where.checkin_date.lte = new Date(endDate);
      }

      // Execute queries in parallel
      const [checkins, totalCount] = await Promise.all([
        prisma.checkin.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy: {
            checkin_date: 'desc'
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                day_of_week: true,
                start_time: true,
                end_time: true,
                teacher: {
                  select: {
                    id: true,
                    full_name: true
                  }
                }
              }
            }
          }
        }),
        prisma.checkin.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: checkins,
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
      console.error("Get student checkins error:", error);
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

  async getClassCheckins(request: Request, classId: string): Promise<Response> {
    try {
      if (!validateUUID(classId)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ID da turma inválido"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      const where: Prisma.CheckinWhereInput = {
        class_id: classId
      };

      // Add date range filter if provided
      const startDate = queryParams.start_date;
      const endDate = queryParams.end_date;
      
      if (startDate || endDate) {
        where.checkin_date = {};
        if (startDate) where.checkin_date.gte = new Date(startDate);
        if (endDate) where.checkin_date.lte = new Date(endDate);
      }

      // Execute queries in parallel
      const [checkins, totalCount] = await Promise.all([
        prisma.checkin.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy: {
            checkin_date: 'desc'
          },
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                belt: true,
                belt_degree: true,
                status: true
              }
            }
          }
        }),
        prisma.checkin.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: checkins,
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
      console.error("Get class checkins error:", error);
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

  async getTodayCheckins(request: Request): Promise<Response> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const checkins = await prisma.checkin.findMany({
        where: {
          checkin_date: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              belt: true,
              belt_degree: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              day_of_week: true,
              start_time: true,
              end_time: true,
              teacher: {
                select: {
                  id: true,
                  full_name: true
                }
              }
            }
          }
        },
        orderBy: {
          checkin_time: 'desc'
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: checkins
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get today checkins error:", error);
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

  async getCheckinStats(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      const where: Prisma.CheckinWhereInput = {};

      if (startDate || endDate) {
        where.checkin_date = {};
        if (startDate) where.checkin_date.gte = new Date(startDate);
        if (endDate) where.checkin_date.lte = new Date(endDate);
      }

      // Get total checkins, unique students, and checkins by class
      const [totalCheckins, uniqueStudents, checkinsByClass] = await Promise.all([
        prisma.checkin.count({ where }),
        prisma.checkin.findMany({
          where,
          select: { student_id: true },
          distinct: ['student_id']
        }).then(result => result.length),
        prisma.checkin.groupBy({
          by: ['class_id'],
          where,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        })
      ]);

      // Get class details for the grouped results
      const classIds = checkinsByClass
        .filter(item => item.class_id)
        .map(item => item.class_id!);

      const classDetails = await prisma.class.findMany({
        where: {
          id: { in: classIds }
        },
        select: {
          id: true,
          name: true,
          teacher: {
            select: {
              full_name: true
            }
          }
        }
      });

      const checkinsByClassWithDetails = checkinsByClass.map(item => ({
        class_id: item.class_id,
        class_name: item.class_id 
          ? classDetails.find(c => c.id === item.class_id)?.name || 'Turma não encontrada'
          : 'Check-in livre',
        teacher_name: item.class_id 
          ? classDetails.find(c => c.id === item.class_id)?.teacher?.full_name || null
          : null,
        checkin_count: item._count.id
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            total_checkins: totalCheckins,
            unique_students: uniqueStudents,
            checkins_by_class: checkinsByClassWithDetails
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get checkin stats error:", error);
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