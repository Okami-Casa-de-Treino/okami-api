import { prisma } from "../config/prisma.js";
import { createExpenseSchema, updateExpenseSchema } from "../utils/validation.js";
import type { Prisma } from "../generated/prisma/index.js";

export class ExpenseController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      const page = parseInt(queryParams.page as string) || 1;
      const limit = Math.min(parseInt(queryParams.limit as string) || 10, 100);
      const skip = (page - 1) * limit;
      const where: Prisma.ExpenseWhereInput = {};
      if (queryParams.search) {
        where.OR = [
          { title: { contains: queryParams.search as string, mode: 'insensitive' } },
          { description: { contains: queryParams.search as string, mode: 'insensitive' } },
          { creditor: { contains: queryParams.search as string, mode: 'insensitive' } }
        ];
      }
      if (queryParams.status) {
        where.status = queryParams.status as any;
      }
      if (queryParams.category) {
        where.category = queryParams.category as any;
      }
      const orderBy: Prisma.ExpenseOrderByWithRelationInput = {};
      const sortField = queryParams.sort || 'due_date';
      const sortOrder = queryParams.order || 'desc';
      orderBy[sortField as keyof Prisma.ExpenseOrderByWithRelationInput] = sortOrder;
      const [expenses, totalCount] = await Promise.all([
        prisma.expense.findMany({
          where,
          skip,
          take: limit,
          orderBy
        }),
        prisma.expense.count({ where })
      ]);
      return new Response(
        JSON.stringify({
          success: true,
          data: expenses,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Get expenses error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  async getById(request: Request, id: string): Promise<Response> {
    try {
      const expense = await prisma.expense.findUnique({ where: { id } });
      if (!expense) {
        return new Response(
          JSON.stringify({ success: false, error: "Despesa não encontrada" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, data: expense }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Get expense by ID error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  async create(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const validation = createExpenseSchema.safeParse(body);
      if (!validation.success) {
        return new Response(
          JSON.stringify({ success: false, error: "Dados inválidos", details: validation.error.errors }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const expenseData = validation.data;
      const newExpense = await prisma.expense.create({
        data: {
          title: expenseData.title,
          description: expenseData.description,
          amount: expenseData.amount,
          due_date: new Date(expenseData.due_date),
          category: expenseData.category,
          creditor: expenseData.creditor,
          reference_number: expenseData.reference_number,
          discount: expenseData.discount ?? 0,
          late_fee: expenseData.late_fee ?? 0,
          notes: expenseData.notes,
          status: expenseData.status,
          payment_method: expenseData.payment_method,
          payment_date: expenseData.payment_date ? new Date(expenseData.payment_date) : undefined
        }
      });
      return new Response(
        JSON.stringify({ success: true, data: newExpense, message: "Despesa criada com sucesso" }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Create expense error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  async update(request: Request, id: string): Promise<Response> {
    try {
      const body = await request.json();
      const validation = updateExpenseSchema.safeParse(body);
      if (!validation.success) {
        return new Response(
          JSON.stringify({ success: false, error: "Dados inválidos", details: validation.error.errors }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const expense = await prisma.expense.findUnique({ where: { id } });
      if (!expense) {
        return new Response(
          JSON.stringify({ success: false, error: "Despesa não encontrada" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      const updatedExpense = await prisma.expense.update({ where: { id }, data: validation.data });
      return new Response(
        JSON.stringify({ success: true, data: updatedExpense, message: "Despesa atualizada com sucesso" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Update expense error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  async delete(request: Request, id: string): Promise<Response> {
    try {
      const expense = await prisma.expense.findUnique({ where: { id } });
      if (!expense) {
        return new Response(
          JSON.stringify({ success: false, error: "Despesa não encontrada" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      await prisma.expense.delete({ where: { id } });
      return new Response(
        JSON.stringify({ success: true, message: "Despesa excluída com sucesso" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Delete expense error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
} 