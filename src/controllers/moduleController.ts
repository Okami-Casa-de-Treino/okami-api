import { prisma } from "../config/prisma.js";
import { createModuleSchema, updateModuleSchema, validateUUID } from "../utils/validation.js";
import type { ApiResponse } from "../types/index.js";
import type { Prisma } from "../generated/prisma/index.js";

export class ModuleController {
  async getAll(request: Request): Promise<Response> {
    try {
      const modules = await prisma.module.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          order_index: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              videos: true
            }
          }
        },
        orderBy: { order_index: 'asc' }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: modules
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get modules error:", error);
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

      const module = await prisma.module.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          order_index: true,
          created_at: true,
          updated_at: true,
          videos: {
            select: {
              id: true,
              title: true,
              description: true,
              file_url: true,
              thumbnail_url: true,
              duration: true,
              upload_date: true
            },
            orderBy: { upload_date: 'desc' }
          },
          _count: {
            select: {
              videos: true
            }
          }
        }
      });

      if (!module) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Módulo não encontrado"
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
          data: module
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get module by ID error:", error);
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
      const validation = createModuleSchema.safeParse(body);
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

      const moduleData = validation.data;

      // Check if module name already exists
      const existingModule = await prisma.module.findUnique({
        where: { name: moduleData.name }
      });

      if (existingModule) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Já existe um módulo com este nome"
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Create module
      const module = await prisma.module.create({
        data: {
          name: moduleData.name,
          description: moduleData.description,
          color: moduleData.color,
          order_index: moduleData.order
        },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          order_index: true,
          created_at: true,
          updated_at: true
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: module
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Create module error:", error);
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
      const validation = updateModuleSchema.safeParse(body);
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

      const moduleData = validation.data;

      // Check if module exists
      const existingModule = await prisma.module.findUnique({
        where: { id }
      });

      if (!existingModule) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Módulo não encontrado"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Check if module name already exists (if name is being updated)
      if (moduleData.name && moduleData.name !== existingModule.name) {
        const moduleWithSameName = await prisma.module.findUnique({
          where: { name: moduleData.name }
        });

        if (moduleWithSameName) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Já existe um módulo com este nome"
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }

      // Update module
      const module = await prisma.module.update({
        where: { id },
        data: {
          name: moduleData.name,
          description: moduleData.description,
          color: moduleData.color,
          order_index: moduleData.order
        },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          order_index: true,
          created_at: true,
          updated_at: true
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: module
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Update module error:", error);
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

      // Check if module exists
      const module = await prisma.module.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              videos: true
            }
          }
        }
      });

      if (!module) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Módulo não encontrado"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Check if module has videos
      if (module._count.videos > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Não é possível excluir um módulo que possui vídeos"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Delete module
      await prisma.module.delete({
        where: { id }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Módulo excluído com sucesso"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Delete module error:", error);
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