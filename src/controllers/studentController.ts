import { prisma } from "../config/prisma.js";
import { createStudentSchema, updateStudentSchema, paginationSchema, validateUUID } from "../utils/validation.js";
import type { ApiResponse } from "../types/index.js";
import type { Prisma } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";

export class StudentController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      // Build where clause
      const where: Prisma.StudentWhereInput = {};

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
      const orderBy: Prisma.StudentOrderByWithRelationInput = {};
      const sortField = pagination.sort || 'created_at';
      const sortOrder = pagination.order || 'desc';
      orderBy[sortField as keyof Prisma.StudentOrderByWithRelationInput] = sortOrder;

      // Execute queries in parallel
      const [students, totalCount] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy,
          select: {
            id: true,
            full_name: true,
            birth_date: true,
            cpf: true,
            rg: true,
            belt: true,
            belt_degree: true,
            address: true,
            phone: true,
            email: true,
            emergency_contact_name: true,
            emergency_contact_phone: true,
            emergency_contact_relationship: true,
            medical_observations: true,
            photo_url: true,
            enrollment_date: true,
            monthly_fee: true,
            status: true,
            created_at: true,
            updated_at: true
          }
        }),
        prisma.student.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: students,
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
      console.error("Get students error:", error);
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
      // Validate UUID
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

      const student = await prisma.student.findUnique({
        where: { id },
        select: {
          id: true,
          full_name: true,
          birth_date: true,
          cpf: true,
          rg: true,
          belt: true,
          belt_degree: true,
          address: true,
          phone: true,
          email: true,
          emergency_contact_name: true,
          emergency_contact_phone: true,
          emergency_contact_relationship: true,
          medical_observations: true,
          photo_url: true,
          enrollment_date: true,
          monthly_fee: true,
          status: true,
          created_at: true,
          updated_at: true
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

      return new Response(
        JSON.stringify({
          success: true,
          data: student
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get student by ID error:", error);
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

      // Validate input
      const validation = createStudentSchema.safeParse(body);
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

      const studentData = validation.data;

      // Hash password if provided
      let passwordHash: string | undefined;
      if (studentData.password) {
        const saltRounds = 12;
        passwordHash = await bcrypt.hash(studentData.password, saltRounds);
      }

      try {
        const newStudent = await prisma.student.create({
          data: {
            full_name: studentData.full_name,
            birth_date: new Date(studentData.birth_date),
            cpf: studentData.cpf,
            rg: studentData.rg,
            belt: studentData.belt,
            belt_degree: studentData.belt_degree,
            address: studentData.address,
            phone: studentData.phone,
            email: studentData.email,
            emergency_contact_name: studentData.emergency_contact_name,
            emergency_contact_phone: studentData.emergency_contact_phone,
            emergency_contact_relationship: studentData.emergency_contact_relationship,
            medical_observations: studentData.medical_observations,
            monthly_fee: studentData.monthly_fee,
            password_hash: passwordHash
          } as any,
          select: {
            id: true,
            full_name: true,
            birth_date: true,
            cpf: true,
            rg: true,
            belt: true,
            belt_degree: true,
            address: true,
            phone: true,
            email: true,
            emergency_contact_name: true,
            emergency_contact_phone: true,
            emergency_contact_relationship: true,
            medical_observations: true,
            photo_url: true,
            enrollment_date: true,
            monthly_fee: true,
            status: true,
            created_at: true,
            updated_at: true
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: newStudent,
            message: "Aluno criado com sucesso"
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        // Handle Prisma unique constraint violations
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
      console.error("Create student error:", error);
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
      // Validate UUID
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

      // Validate input
      const validation = updateStudentSchema.safeParse(body);
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

      const studentData = validation.data;

      // Build update data
      const updateData: Prisma.StudentUpdateInput = {};
      
      if (studentData.full_name !== undefined) updateData.full_name = studentData.full_name;
      if (studentData.birth_date !== undefined) updateData.birth_date = new Date(studentData.birth_date);
      if (studentData.cpf !== undefined) updateData.cpf = studentData.cpf;
      if (studentData.rg !== undefined) updateData.rg = studentData.rg;
      if (studentData.belt !== undefined) updateData.belt = studentData.belt;
      if (studentData.belt_degree !== undefined) updateData.belt_degree = studentData.belt_degree;
      if (studentData.address !== undefined) updateData.address = studentData.address;
      if (studentData.phone !== undefined) updateData.phone = studentData.phone;
      if (studentData.email !== undefined) updateData.email = studentData.email;
      if (studentData.emergency_contact_name !== undefined) updateData.emergency_contact_name = studentData.emergency_contact_name;
      if (studentData.emergency_contact_phone !== undefined) updateData.emergency_contact_phone = studentData.emergency_contact_phone;
      if (studentData.emergency_contact_relationship !== undefined) updateData.emergency_contact_relationship = studentData.emergency_contact_relationship;
      if (studentData.medical_observations !== undefined) updateData.medical_observations = studentData.medical_observations;
      if (studentData.monthly_fee !== undefined) updateData.monthly_fee = studentData.monthly_fee;
      if (studentData.status !== undefined) updateData.status = studentData.status as any;
      
      // Hash password if provided
      if (studentData.password !== undefined) {
        const saltRounds = 12;
        updateData.password_hash = await bcrypt.hash(studentData.password, saltRounds);
      }

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
        const updatedStudent = await prisma.student.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            full_name: true,
            birth_date: true,
            cpf: true,
            rg: true,
            belt: true,
            belt_degree: true,
            address: true,
            phone: true,
            email: true,
            emergency_contact_name: true,
            emergency_contact_phone: true,
            emergency_contact_relationship: true,
            medical_observations: true,
            photo_url: true,
            enrollment_date: true,
            monthly_fee: true,
            status: true,
            created_at: true,
            updated_at: true
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: updatedStudent,
            message: "Aluno atualizado com sucesso"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error: any) {
        // Handle Prisma errors
        if (error.code === 'P2002') {
          const field = error.meta?.target?.[0];
          const message = field === 'cpf' ? 'CPF já cadastrado para outro aluno' : 
                         field === 'email' ? 'Email já cadastrado para outro aluno' : 
                         field === 'phone' ? 'Telefone já cadastrado para outro aluno' :
                         'Dados já cadastrados para outro aluno';
          
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
              error: "Aluno não encontrado"
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
      console.error("Update student error:", error);
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
      // Validate UUID
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

      // Get delete type from query parameter
      const url = new URL(request.url);
      const deleteType = url.searchParams.get('type') || 'auto'; // 'soft', 'hard', or 'auto'

      try {
        // Check if student exists
        const student = await prisma.student.findUnique({
          where: { id },
          include: {
            payments: { take: 1 },
            checkins: { take: 1 },
            student_classes: { take: 1 },
            belt_promotions: { take: 1 }
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

        // Check for related records
        const hasRelatedRecords = 
          student.payments.length > 0 || 
          student.checkins.length > 0 || 
          student.student_classes.length > 0 ||
          student.belt_promotions.length > 0;

        if (deleteType === 'soft' || (deleteType === 'auto' && hasRelatedRecords)) {
          // Soft delete by setting status to inactive
          await prisma.student.update({
            where: { id },
            data: { status: 'inactive' }
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: hasRelatedRecords 
                ? "Aluno desativado com sucesso (possui registros relacionados)" 
                : "Aluno desativado com sucesso",
              deleteType: 'soft'
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        } else if (deleteType === 'hard') {
          // Hard delete - cascade delete all related records
          await prisma.$transaction(async (tx) => {
            // Delete in correct order to respect foreign key constraints
            
            // Delete belt promotions
            await tx.beltPromotion.deleteMany({
              where: { student_id: id }
            });
            
            // Delete checkins
            await tx.checkin.deleteMany({
              where: { student_id: id }
            });
            
            // Delete payments
            await tx.payment.deleteMany({
              where: { student_id: id }
            });
            
            // Delete student class enrollments
            await tx.studentClass.deleteMany({
              where: { student_id: id }
            });
            
            // Finally, delete the student
            await tx.student.delete({
              where: { id }
            });
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: "Aluno e todos os registros relacionados foram removidos permanentemente",
              deleteType: 'hard'
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        } else {
          // Auto mode - decide based on related records (legacy behavior)
          if (hasRelatedRecords) {
            // Soft delete
            await prisma.student.update({
              where: { id },
              data: { status: 'inactive' }
            });

            return new Response(
              JSON.stringify({
                success: true,
                message: "Aluno desativado com sucesso (possui registros relacionados)",
                deleteType: 'soft'
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" }
              }
            );
          } else {
            // Hard delete
            await prisma.student.delete({
              where: { id }
            });

            return new Response(
              JSON.stringify({
                success: true,
                message: "Aluno removido com sucesso",
                deleteType: 'hard'
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
        }

      } catch (error: any) {
        if (error.code === 'P2025') {
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
        throw error;
      }

    } catch (error) {
      console.error("Delete student error:", error);
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

  async getStudentClasses(request: Request, id: string): Promise<Response> {
    try {
      // Validate UUID
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

      const studentClasses = await prisma.studentClass.findMany({
        where: { student_id: id },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              days_of_week: true,
              start_time: true,
              end_time: true,
              max_students: true,
              belt_requirement: true,
              age_group: true,
              status: true,
              teacher: {
                select: {
                  full_name: true
                }
              }
            }
          }
        },
        orderBy: [
                      { class: { days_of_week: 'asc' } },
          { class: { start_time: 'asc' } }
        ]
      });

      // Transform the data to match the expected format
      const transformedData = studentClasses.map(sc => ({
        id: sc.class.id,
        name: sc.class.name,
        description: sc.class.description,
                    days_of_week: sc.class.days_of_week,
        start_time: sc.class.start_time,
        end_time: sc.class.end_time,
        max_students: sc.class.max_students,
        belt_requirement: sc.class.belt_requirement,
        age_group: sc.class.age_group,
        status: sc.class.status,
        teacher_name: sc.class.teacher?.full_name || null,
        enrollment_date: sc.enrollment_date,
        enrollment_status: sc.status
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: transformedData
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get student classes error:", error);
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

  async enrollInClass(request: Request, id: string): Promise<Response> {
    try {
      // Validate UUID
      if (!validateUUID(id)) {
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

      const body = await request.json() as { class_id?: string };
      const { class_id } = body;

      if (!class_id || !validateUUID(class_id)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ID da aula inválido"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      try {
        // Check if student and class exist, and if there's capacity
        const [student, classData, currentEnrollments, existingEnrollment] = await Promise.all([
          prisma.student.findUnique({
            where: { id, status: 'active' }
          }),
          prisma.class.findUnique({
            where: { id: class_id, status: 'active' }
          }),
          prisma.studentClass.count({
            where: { class_id, status: 'active' }
          }),
          prisma.studentClass.findUnique({
            where: {
              student_id_class_id: {
                student_id: id,
                class_id: class_id
              }
            }
          })
        ]);

        if (!student) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aluno não encontrado ou inativo"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        if (!classData) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aula não encontrada ou inativa"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        if (existingEnrollment) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aluno já está matriculado nesta aula"
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        if (currentEnrollments >= (classData.max_students || 30)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aula já está com capacidade máxima"
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Enroll student
        await prisma.studentClass.create({
          data: {
            student_id: id,
            class_id: class_id
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Aluno matriculado na aula com sucesso"
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
              error: "Aluno já está matriculado nesta aula"
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
      console.error("Enroll in class error:", error);
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

  async unenrollFromClass(request: Request, studentId: string, classId: string): Promise<Response> {
    try {
      // Validate UUIDs
      if (!validateUUID(studentId) || !validateUUID(classId)) {
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
        await prisma.studentClass.delete({
          where: {
            student_id_class_id: {
              student_id: studentId,
              class_id: classId
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Aluno removido da aula com sucesso"
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
      console.error("Unenroll from class error:", error);
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