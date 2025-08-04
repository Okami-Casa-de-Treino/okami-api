import { prisma } from "../config/prisma.js";
import { createClassSchema, updateClassSchema, paginationSchema, validateUUID } from "../utils/validation.js";
import type { Prisma } from "../generated/prisma/index.js";

export class ClassController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      // Build where clause
      const where: Prisma.ClassWhereInput = {};

      // Add search filter
      if (pagination.search) {
        where.OR = [
          { name: { contains: pagination.search, mode: 'insensitive' } },
          { description: { contains: pagination.search, mode: 'insensitive' } },
          { teacher: { full_name: { contains: pagination.search, mode: 'insensitive' } } }
        ];
      }

      // Add status filter
      if (pagination.status) {
        where.status = pagination.status as any;
      }

      // Build orderBy
      const orderBy: Prisma.ClassOrderByWithRelationInput = {};
      const sortField = pagination.sort || 'created_at';
      const sortOrder = pagination.order || 'desc';
      orderBy[sortField as keyof Prisma.ClassOrderByWithRelationInput] = sortOrder;

      // Execute queries in parallel
      const [classes, totalCount] = await Promise.all([
        prisma.class.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy,
          include: {
            teacher: {
              select: {
                id: true,
                full_name: true,
                email: true,
                belt: true,
                belt_degree: true
              }
            },
            _count: {
              select: {
                student_classes: {
                  where: { status: 'active' }
                }
              }
            }
          }
        }),
        prisma.class.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: classes,
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
      console.error("Get classes error:", error);
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

      const classData = await prisma.class.findUnique({
        where: { id },
        include: {
          teacher: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              belt: true,
              belt_degree: true,
              specialties: true
            }
          },
          student_classes: {
            where: { status: 'active' },
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
            },
            orderBy: {
              created_at: 'asc'
            }
          },
          _count: {
            select: {
              student_classes: {
                where: { status: 'active' }
              }
            }
          }
        }
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

      return new Response(
        JSON.stringify({
          success: true,
          data: classData
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get class by ID error:", error);
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

      const validation = createClassSchema.safeParse(body);
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

      const classData = validation.data;

      try {
        // Check if teacher exists
        const teacher = await prisma.teacher.findUnique({
          where: { id: classData.teacher_id },
          select: { id: true, status: true }
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

        if (teacher.status !== 'active') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Professor não está ativo"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Parse DateTime with timezone and extract local time
        const startDateTime = new Date(classData.start_time);
        const endDateTime = new Date(classData.end_time);
        
        // Convert to Brazil timezone (UTC-3) and extract time
        const startTime = new Date(startDateTime.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const endTime = new Date(endDateTime.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

        const newClass = await prisma.class.create({
          data: {
            name: classData.name,
            description: classData.description,
            teacher_id: classData.teacher_id,
            days_of_week: classData.days_of_week,
            start_time: startTime,
            end_time: endTime,
            max_students: classData.max_students,
            belt_requirement: classData.belt_requirement,
            age_group: classData.age_group
          },
          include: {
            teacher: {
              select: {
                id: true,
                full_name: true,
                email: true,
                belt: true,
                belt_degree: true
              }
            },
            _count: {
              select: {
                student_classes: {
                  where: { status: 'active' }
                }
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: newClass,
            message: "Turma criada com sucesso"
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        if (error.code === 'P2002') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Já existe uma turma com este nome"
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
      console.error("Create class error:", error);
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
      const validation = updateClassSchema.safeParse(body);
      
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

      const classData = validation.data;

      // Build update data
      const updateData: Prisma.ClassUpdateInput = {};
      
      if (classData.name !== undefined) updateData.name = classData.name;
      if (classData.description !== undefined) updateData.description = classData.description;
      if (classData.teacher_id !== undefined) {
        // Check if teacher exists and is active
        const teacher = await prisma.teacher.findUnique({
          where: { id: classData.teacher_id },
          select: { id: true, status: true }
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

        if (teacher.status !== 'active') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Professor não está ativo"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        updateData.teacher = { connect: { id: classData.teacher_id } };
      }
      if (classData.days_of_week !== undefined) updateData.days_of_week = classData.days_of_week;
      if (classData.start_time !== undefined) {
        const startDateTime = new Date(classData.start_time);
        updateData.start_time = new Date(startDateTime.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      }
      if (classData.end_time !== undefined) {
        const endDateTime = new Date(classData.end_time);
        updateData.end_time = new Date(endDateTime.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      }
      if (classData.max_students !== undefined) updateData.max_students = classData.max_students;
      if (classData.belt_requirement !== undefined) updateData.belt_requirement = classData.belt_requirement;
      if (classData.age_group !== undefined) updateData.age_group = classData.age_group;

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
        const updatedClass = await prisma.class.update({
          where: { id },
          data: updateData,
          include: {
            teacher: {
              select: {
                id: true,
                full_name: true,
                email: true,
                belt: true,
                belt_degree: true
              }
            },
            _count: {
              select: {
                student_classes: {
                  where: { status: 'active' }
                }
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: updatedClass,
            message: "Turma atualizada com sucesso"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        if (error.code === 'P2002') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Já existe uma turma com este nome"
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
              error: "Turma não encontrada"
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
      console.error("Update class error:", error);
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
        // Check if class exists and has related records
        const classData = await prisma.class.findUnique({
          where: { id },
          include: {
            student_classes: { take: 1 },
            checkins: { take: 1 }
          }
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

        // Check for related records
        const hasRelatedRecords = classData.student_classes.length > 0 || classData.checkins.length > 0;

        if (hasRelatedRecords) {
          // Soft delete by setting status to inactive
          await prisma.class.update({
            where: { id },
            data: { status: 'inactive' }
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: "Turma desativada com sucesso (possui registros relacionados)"
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        } else {
          // Hard delete if no related records
          await prisma.class.delete({
            where: { id }
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: "Turma removida com sucesso"
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
              error: "Turma não encontrada"
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
      console.error("Delete class error:", error);
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

  async enrollStudent(request: Request, classId: string): Promise<Response> {
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

      const body = await request.json();
      const { student_id } = body as { student_id: string };

      if (!student_id || !validateUUID(student_id)) {
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

      try {
        // Check if class exists and is active
        const classData = await prisma.class.findUnique({
          where: { id: classId },
          include: {
            _count: {
              select: {
                student_classes: {
                  where: { status: 'active' }
                }
              }
            }
          }
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

        // Check if class is full
        if (classData.max_students && classData._count.student_classes >= classData.max_students) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Turma está lotada"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Check if student exists and is active
        const student = await prisma.student.findUnique({
          where: { id: student_id },
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

        // Create enrollment
        const enrollment = await prisma.studentClass.create({
          data: {
            student_id,
            class_id: classId
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
                days_of_week: true,
                start_time: true,
                end_time: true
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: enrollment,
            message: "Aluno matriculado com sucesso"
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        if (error.code === 'P2002') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aluno já está matriculado nesta turma"
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
      console.error("Enroll student error:", error);
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

  async unenrollStudent(request: Request, classId: string, studentId: string): Promise<Response> {
    try {
      if (!validateUUID(classId) || !validateUUID(studentId)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "IDs inválidos"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      try {
        // Find the enrollment
        const enrollment = await prisma.studentClass.findFirst({
          where: {
            student_id: studentId,
            class_id: classId,
            status: 'active'
          }
        });

        if (!enrollment) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Matrícula não encontrada"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Update status to inactive (soft delete)
        await prisma.studentClass.update({
          where: { id: enrollment.id },
          data: { status: 'inactive' }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Aluno desmatriculado com sucesso"
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
              error: "Matrícula não encontrada"
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
      console.error("Unenroll student error:", error);
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

  async getClassStudents(request: Request, id: string): Promise<Response> {
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

      const students = await prisma.studentClass.findMany({
        where: {
          class_id: id,
          status: 'active'
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
              status: true,
              created_at: true
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: students
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get class students error:", error);
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

  async getSchedule(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      // Optional filters
      const teacherId = queryParams.teacher_id;
      const status = queryParams.status || 'active';

      // Build where clause
      const where: Prisma.ClassWhereInput = {
        status: status as any
      };

      if (teacherId && validateUUID(teacherId)) {
        where.teacher_id = teacherId;
      }

      // Get all active classes with schedule information
      const classes = await prisma.class.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              full_name: true,
              belt: true,
              belt_degree: true
            }
          },
          _count: {
            select: {
              student_classes: {
                where: { status: 'active' }
              }
            }
          }
        },
        orderBy: [
          { start_time: 'asc' }
        ]
      });

      // Days mapping (0 = Sunday, 1 = Monday, etc.)
      const daysMap = {
        0: 'Domingo',
        1: 'Segunda-feira',
        2: 'Terça-feira', 
        3: 'Quarta-feira',
        4: 'Quinta-feira',
        5: 'Sexta-feira',
        6: 'Sábado'
      };

      // Group classes by day of week
      const schedule: Record<string, any[]> = {};
      
      // Initialize all days
      Object.values(daysMap).forEach(day => {
        schedule[day] = [];
      });

      classes.forEach(classItem => {
        if (classItem.days_of_week && classItem.days_of_week.length > 0) {
          classItem.days_of_week.forEach(dayNumber => {
            const dayName = daysMap[dayNumber as keyof typeof daysMap];
            if (dayName && schedule[dayName]) {
              schedule[dayName].push({
                id: classItem.id,
                name: classItem.name,
                description: classItem.description,
                start_time: classItem.start_time,
                end_time: classItem.end_time,
                max_students: classItem.max_students,
                current_students: classItem._count.student_classes,
                belt_requirement: classItem.belt_requirement,
                age_group: classItem.age_group,
                teacher: classItem.teacher,
                status: classItem.status
              });
            }
          });
        }
      });

      // Sort classes within each day by start time
      Object.keys(schedule).forEach(day => {
        if (schedule[day]) {
          schedule[day].sort((a, b) => {
            if (!a.start_time && !b.start_time) return 0;
            if (!a.start_time) return 1;
            if (!b.start_time) return -1;
            
            // Convert time to string for comparison
            const timeA = a.start_time instanceof Date ? a.start_time.toISOString() : String(a.start_time);
            const timeB = b.start_time instanceof Date ? b.start_time.toISOString() : String(b.start_time);
            
            return timeA.localeCompare(timeB);
          });
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            schedule,
            summary: {
              total_classes: classes.length,
              days_with_classes: Object.values(schedule).filter(dayClasses => dayClasses.length > 0).length,
              teachers_count: [...new Set(classes.map(c => c.teacher_id).filter(Boolean))].length
            }
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get schedule error:", error);
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