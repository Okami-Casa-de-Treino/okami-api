import { prisma } from "../config/prisma.js";
import { createPaymentSchema, updatePaymentSchema, paginationSchema, validateUUID } from "../utils/validation.js";
import type { Prisma } from "../generated/prisma/index.js";

export class PaymentController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      // Build where clause
      const where: Prisma.PaymentWhereInput = {};

      // Add search filter
      if (pagination.search) {
        where.OR = [
          { student: { full_name: { contains: pagination.search, mode: 'insensitive' } } },
          { student: { cpf: { contains: pagination.search, mode: 'insensitive' } } }
        ];
      }

      // Add status filter
      if (pagination.status) {
        where.status = pagination.status as any;
      }

      // Build orderBy
      const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
      const sortField = pagination.sort || 'due_date';
      const sortOrder = pagination.order || 'desc';
      orderBy[sortField as keyof Prisma.PaymentOrderByWithRelationInput] = sortOrder;

      // Execute queries in parallel
      const [payments, totalCount] = await Promise.all([
        prisma.payment.findMany({
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
                status: true
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: payments,
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
      console.error("Get payments error:", error);
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

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              cpf: true,
              status: true,
              birth_date: true
            }
          }
        }
      });

      if (!payment) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Pagamento não encontrado"
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
          data: payment
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get payment by ID error:", error);
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

      const validation = createPaymentSchema.safeParse(body);
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

      const paymentData = validation.data;

      try {
        // Check if student exists and is active
        const student = await prisma.student.findUnique({
          where: { id: paymentData.student_id },
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

        const newPayment = await prisma.payment.create({
          data: {
            student_id: paymentData.student_id,
            amount: paymentData.amount,
            due_date: new Date(paymentData.due_date),
            reference_month: paymentData.reference_month ? new Date(paymentData.reference_month + '-01') : null,
            discount: paymentData.discount || 0,
            notes: paymentData.notes
          },
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                cpf: true
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: newPayment,
            message: "Pagamento criado com sucesso"
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
      console.error("Create payment error:", error);
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
      const validation = updatePaymentSchema.safeParse(body);
      
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

      const paymentData = validation.data;

      // Build update data
      const updateData: Prisma.PaymentUpdateInput = {};
      
      if (paymentData.student_id !== undefined) updateData.student_id = paymentData.student_id;
      if (paymentData.amount !== undefined) updateData.amount = paymentData.amount;
      if (paymentData.due_date !== undefined) updateData.due_date = new Date(paymentData.due_date);
      if (paymentData.reference_month !== undefined) updateData.reference_month = new Date(paymentData.reference_month);
      if (paymentData.payment_date !== undefined) updateData.payment_date = paymentData.payment_date ? new Date(paymentData.payment_date) : null;
      if (paymentData.payment_method !== undefined) updateData.payment_method = paymentData.payment_method as any;
      if (paymentData.status !== undefined) updateData.status = paymentData.status;
      if (paymentData.discount !== undefined) updateData.discount = paymentData.discount;
      if (paymentData.late_fee !== undefined) updateData.late_fee = paymentData.late_fee;
      if (paymentData.notes !== undefined) updateData.notes = paymentData.notes;

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
        const updatedPayment = await prisma.payment.update({
          where: { id },
          data: updateData,
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                cpf: true
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: updatedPayment,
            message: "Pagamento atualizado com sucesso"
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
              error: "Pagamento não encontrado"
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
      console.error("Update payment error:", error);
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
        // Check if payment exists
        const payment = await prisma.payment.findUnique({
          where: { id }
        });

        if (!payment) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Pagamento não encontrado"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Check if payment is already processed
        if (payment.status === 'paid') {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Não é possível excluir um pagamento já processado"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Delete payment
        await prisma.payment.delete({
          where: { id }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Pagamento removido com sucesso"
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
              error: "Pagamento não encontrado"
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
      console.error("Delete payment error:", error);
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

  async getByStudent(request: Request, studentId: string): Promise<Response> {
    return new Response(JSON.stringify({ success: true, data: [], message: `Payments for student ${studentId}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  async getOverdue(request: Request): Promise<Response> {
    return new Response(JSON.stringify({ success: true, data: [], message: "Overdue payments" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  async generateMonthly(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { reference_month, due_day, month, year } = body as { 
        reference_month?: string; 
        due_day?: number;
        month?: number;
        year?: number;
      };

      // Support both formats: { reference_month: "2025-10-01" } and { month: 10, year: 2025 }
      let referenceDate: Date;
      if (reference_month) {
        referenceDate = new Date(reference_month);
      } else if (month !== undefined && year !== undefined) {
        // month is 1-based in the request, but Date constructor expects 0-based
        referenceDate = new Date(year, month - 1, 1);
      } else {
        referenceDate = new Date();
      }
      
      const targetYear = referenceDate.getFullYear();
      const targetMonth = referenceDate.getMonth(); // 0-based (0 = January, 9 = October)
      
      // Set reference month to first day of the month
      const referenceMonth = new Date(targetYear, targetMonth, 1);
      
      // Set due date (default to 10th of the month)
      const dueDayOfMonth = due_day || 10;
      const dueDate = new Date(targetYear, targetMonth, dueDayOfMonth);

      console.log(`🔍 Debug - Reference month: ${referenceMonth.toISOString()}`);
      console.log(`🔍 Debug - Target year: ${targetYear}, Target month: ${targetMonth} (${targetMonth + 1})`);

      // Find all active students
      const activeStudents = await prisma.student.findMany({
        where: {
          status: 'active',
          monthly_fee: {
            not: null,
            gt: 0
          }
        },
        select: {
          id: true,
          full_name: true,
          monthly_fee: true,
          payments: {
            where: {
              reference_month: {
                gte: new Date(targetYear, targetMonth, 1),
                lt: new Date(targetYear, targetMonth + 1, 1)
              }
            },
            select: {
              id: true,
              reference_month: true
            }
          }
        }
      });

      console.log(`🔍 Debug - Found ${activeStudents.length} active students with monthly_fee`);
      
      // Filter students who don't have a payment for this month yet
      const studentsWithoutPayment = activeStudents.filter(student => {
        const hasPayment = student.payments.length > 0;
        console.log(`🔍 Debug - Student ${student.full_name}: ${hasPayment ? 'HAS' : 'NO'} payment for ${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')} (${student.payments.length} payments found)`);
        return !hasPayment;
      });

      console.log(`🔍 Debug - Students without payment: ${studentsWithoutPayment.length}`);

      if (studentsWithoutPayment.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Nenhum pagamento foi gerado. Todos os alunos ativos já possuem pagamento para este mês.",
            data: {
              reference_month: referenceMonth.toISOString().split('T')[0],
              due_date: dueDate.toISOString().split('T')[0],
              total_active_students: activeStudents.length,
              students_with_existing_payment: activeStudents.length - studentsWithoutPayment.length,
              payments_generated: 0,
              debug_info: {
                target_year: targetYear,
                target_month: targetMonth + 1,
                students_with_payments: activeStudents.filter(s => s.payments.length > 0).map(s => ({
                  name: s.full_name,
                  payments_count: s.payments.length,
                  payment_dates: s.payments.map(p => p.reference_month?.toISOString().split('T')[0])
                }))
              }
            }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Generate payments for students without payment for this month
      const paymentsToCreate = studentsWithoutPayment.map(student => ({
        student_id: student.id,
        amount: student.monthly_fee!,
        due_date: dueDate,
        reference_month: referenceMonth,
        status: 'pending' as const,
        notes: `Mensalidade referente a ${referenceMonth.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        })}`
      }));

      // Create all payments in a single transaction
      const createdPayments = await prisma.payment.createMany({
        data: paymentsToCreate
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `${createdPayments.count} pagamentos mensais foram gerados com sucesso`,
          data: {
            reference_month: referenceMonth.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            total_active_students: activeStudents.length,
            students_with_existing_payment: activeStudents.length - studentsWithoutPayment.length,
            payments_generated: createdPayments.count,
            generated_for_students: studentsWithoutPayment.map(s => ({
              id: s.id,
              name: s.full_name,
              amount: s.monthly_fee
            }))
          }
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Generate monthly payments error:", error);
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

  async markAsPaid(request: Request, id: string): Promise<Response> {
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
      const { payment_method, payment_date } = body as { payment_method?: string; payment_date?: string };

      try {
        const updatedPayment = await prisma.payment.update({
          where: { id },
          data: {
            status: 'paid',
            payment_date: payment_date ? new Date(payment_date) : new Date(),
            payment_method: payment_method || 'cash'
          },
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                cpf: true
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: updatedPayment,
            message: "Pagamento marcado como pago"
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
              error: "Pagamento não encontrado"
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
      console.error("Mark payment as paid error:", error);
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

  async getOverduePayments(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const pagination = paginationSchema.parse(queryParams);
      const skip = (pagination.page - 1) * pagination.limit;

      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      const where: Prisma.PaymentWhereInput = {
        status: 'pending',
        due_date: {
          lt: today
        }
      };

      // Add search filter
      if (pagination.search) {
        where.AND = [
          {
            OR: [
              { student: { full_name: { contains: pagination.search, mode: 'insensitive' } } },
              { student: { cpf: { contains: pagination.search, mode: 'insensitive' } } }
            ]
          }
        ];
      }

      // Execute queries in parallel
      const [payments, totalCount] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy: {
            due_date: 'asc'
          },
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                cpf: true,
                status: true
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: payments,
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
      console.error("Get overdue payments error:", error);
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

  async getStudentPayments(request: Request, studentId: string): Promise<Response> {
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

      const where: Prisma.PaymentWhereInput = {
        student_id: studentId
      };

      // Add status filter
      if (pagination.status) {
        where.status = pagination.status as any;
      }

      // Execute queries in parallel
      const [payments, totalCount] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy: {
            due_date: 'desc'
          },
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                cpf: true
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: payments,
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
      console.error("Get student payments error:", error);
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