import { prisma } from "../config/prisma.js";
import { createVideoSchema, updateVideoSchema, videoQuerySchema, validateUUID } from "../utils/validation.js";
import type { ApiResponse } from "../types/index.js";
import type { Prisma } from "../generated/prisma/index.js";
import { FileUploadService } from "../services/fileUploadService.js";

export class VideoController {
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const query = videoQuerySchema.parse(queryParams);
      const skip = (query.page - 1) * query.limit;

      // Build where clause
      const where: Prisma.VideoWhereInput = {};

      // Add search filter
      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      // Add module filter
      if (query.module_id) {
        where.module_id = query.module_id;
      }

      // Add assigned class filter
      if (query.assigned_class_id) {
        where.assigned_class_id = query.assigned_class_id;
      }

      // Build orderBy
      const orderBy: Prisma.VideoOrderByWithRelationInput = {};
      const sortField = query.sort_by === 'upload_date' ? 'upload_date' : 
                       query.sort_by === 'duration' ? 'duration' : 'title';
      orderBy[sortField as keyof Prisma.VideoOrderByWithRelationInput] = query.sort_order;

      // Execute queries in parallel
      const [videos, totalCount] = await Promise.all([
        prisma.video.findMany({
          where,
          skip,
          take: query.limit,
          orderBy,
          select: {
            id: true,
            title: true,
            description: true,
            file_url: true,
            thumbnail_url: true,
            module_id: true,
            module: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true
              }
            },
            assigned_class_id: true,
            assigned_class: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            duration: true,
            file_size: true,
            mime_type: true,
            upload_date: true,
            created_at: true,
            updated_at: true
          }
        }),
        prisma.video.count({ where })
      ]);

      // Convert BigInt to number for JSON serialization
      const serializedVideos = videos.map(video => ({
        ...video,
        file_size: video.file_size ? Number(video.file_size) : null
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: serializedVideos,
          pagination: {
            page: query.page,
            limit: query.limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / query.limit)
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get videos error:", error);
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

      const video = await prisma.video.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          file_url: true,
          thumbnail_url: true,
          module_id: true,
          module: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true
            }
          },
          assigned_class_id: true,
          assigned_class: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          duration: true,
          file_size: true,
          mime_type: true,
          upload_date: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!video) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Vídeo não encontrado"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Convert BigInt to number for JSON serialization
      const serializedVideo = {
        ...video,
        file_size: video.file_size ? Number(video.file_size) : null
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: serializedVideo
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get video by ID error:", error);
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
      const validation = createVideoSchema.safeParse(body);
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

      const videoData = validation.data;

      // Check if module exists
      const module = await prisma.module.findUnique({
        where: { id: videoData.module_id }
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

      // Check if assigned class exists (if provided)
      if (videoData.assigned_class_id) {
        const assignedClass = await prisma.class.findUnique({
          where: { id: videoData.assigned_class_id }
        });

        if (!assignedClass) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aula não encontrada"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }

      // Create video
      const video = await prisma.video.create({
        data: {
          title: videoData.title,
          description: videoData.description,
          file_url: videoData.file_url,
          thumbnail_url: videoData.thumbnail_url,
          module_id: videoData.module_id,
          assigned_class_id: videoData.assigned_class_id,
          duration: videoData.duration,
          file_size: videoData.file_size ? BigInt(videoData.file_size) : null,
          mime_type: videoData.mime_type
        },
        select: {
          id: true,
          title: true,
          description: true,
          file_url: true,
          thumbnail_url: true,
          module_id: true,
          module: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true
            }
          },
          assigned_class_id: true,
          assigned_class: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          duration: true,
          file_size: true,
          mime_type: true,
          upload_date: true,
          created_at: true,
          updated_at: true
        }
      });

      // Convert BigInt to number for JSON serialization
      const serializedVideo = {
        ...video,
        file_size: video.file_size ? Number(video.file_size) : null
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: serializedVideo
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Create video error:", error);
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
      const validation = updateVideoSchema.safeParse(body);
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

      const videoData = validation.data;

      // Check if video exists
      const existingVideo = await prisma.video.findUnique({
        where: { id }
      });

      if (!existingVideo) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Vídeo não encontrado"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Check if module exists (if provided)
      if (videoData.module_id) {
        const module = await prisma.module.findUnique({
          where: { id: videoData.module_id }
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
      }

      // Check if assigned class exists (if provided)
      if (videoData.assigned_class_id) {
        const assignedClass = await prisma.class.findUnique({
          where: { id: videoData.assigned_class_id }
        });

        if (!assignedClass) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Aula não encontrada"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }

      // Update video
      const video = await prisma.video.update({
        where: { id },
        data: {
          title: videoData.title,
          description: videoData.description,
          file_url: videoData.file_url,
          thumbnail_url: videoData.thumbnail_url,
          module_id: videoData.module_id,
          assigned_class_id: videoData.assigned_class_id,
          duration: videoData.duration,
          file_size: videoData.file_size ? BigInt(videoData.file_size) : undefined,
          mime_type: videoData.mime_type
        },
        select: {
          id: true,
          title: true,
          description: true,
          file_url: true,
          thumbnail_url: true,
          module_id: true,
          module: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true
            }
          },
          assigned_class_id: true,
          assigned_class: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          duration: true,
          file_size: true,
          mime_type: true,
          upload_date: true,
          created_at: true,
          updated_at: true
        }
      });

      // Convert BigInt to number for JSON serialization
      const serializedVideo = {
        ...video,
        file_size: video.file_size ? Number(video.file_size) : null
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: serializedVideo
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Update video error:", error);
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

      // Check if video exists
      const video = await prisma.video.findUnique({
        where: { id }
      });

      if (!video) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Vídeo não encontrado"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Delete video
      await prisma.video.delete({
        where: { id }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Vídeo excluído com sucesso"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Delete video error:", error);
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

  async getByModule(request: Request, moduleId: string): Promise<Response> {
    try {
      // Validate UUID
      if (!validateUUID(moduleId)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ID do módulo inválido"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Check if module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId }
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

      const videos = await prisma.video.findMany({
        where: { module_id: moduleId },
        select: {
          id: true,
          title: true,
          description: true,
          file_url: true,
          thumbnail_url: true,
          module_id: true,
          module: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true
            }
          },
          assigned_class_id: true,
          assigned_class: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          duration: true,
          file_size: true,
          mime_type: true,
          upload_date: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { upload_date: 'desc' }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: videos
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get videos by module error:", error);
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

  async getByClass(request: Request, classId: string): Promise<Response> {
    try {
      // Validate UUID
      if (!validateUUID(classId)) {
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

      // Check if class exists
      const class_ = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!class_) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Aula não encontrada"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const videos = await prisma.video.findMany({
        where: { assigned_class_id: classId },
        select: {
          id: true,
          title: true,
          description: true,
          file_url: true,
          thumbnail_url: true,
          module_id: true,
          module: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true
            }
          },
          assigned_class_id: true,
          assigned_class: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          duration: true,
          file_size: true,
          mime_type: true,
          upload_date: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { upload_date: 'desc' }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: videos
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get videos by class error:", error);
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

  async getFreeVideos(request: Request): Promise<Response> {
    try {
      const videos = await prisma.video.findMany({
        where: { assigned_class_id: null },
        select: {
          id: true,
          title: true,
          description: true,
          file_url: true,
          thumbnail_url: true,
          module_id: true,
          module: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true
            }
          },
          assigned_class_id: true,
          assigned_class: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          duration: true,
          file_size: true,
          mime_type: true,
          upload_date: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { upload_date: 'desc' }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: videos
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get free videos error:", error);
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

  async uploadFile(request: Request): Promise<Response> {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Arquivo não fornecido"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const fileUploadService = new FileUploadService();
      const uploadResult = await fileUploadService.uploadVideo(file);

      return new Response(
        JSON.stringify({
          success: true,
          data: uploadResult
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("File upload error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Erro interno do servidor"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
} 