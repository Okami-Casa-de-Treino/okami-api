import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { AuthMiddleware } from "../middleware/auth.js";
import { loginSchema } from "../utils/validation.js";
import type { AuthResponse } from "../types/index.js";

export class AuthController {
  async login(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      
      // Validate input
      const validation = loginSchema.safeParse(body);
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

      const { username, password } = validation.data;

      // Find user by username using Prisma
      const user = await prisma.user.findFirst({
        where: {
          username,
          status: 'active'
        },
        include: {
          teacher: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Credenciais inválidas"
          }),
          { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Credenciais inválidas"
          }),
          { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Generate JWT token
      const userWithoutPassword = { 
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        teacher_id: user.teacher_id,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
        teacher: user.teacher
      };
        
      const token = AuthMiddleware.generateToken(userWithoutPassword);

      const response: AuthResponse = {
        token,
        user: userWithoutPassword
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: response,
          message: "Login realizado com sucesso"
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );

    } catch (error) {
      console.error("Login error:", error);
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

  async refresh(request: Request): Promise<Response> {
    try {
      const user = await AuthMiddleware.getUserFromRequest(request);
      
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Token inválido"
          }),
          { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Generate new token
      const newToken = AuthMiddleware.generateToken(user);

      return new Response(
        JSON.stringify({
          success: true,
          data: { token: newToken },
          message: "Token renovado com sucesso"
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );

    } catch (error) {
      console.error("Token refresh error:", error);
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

  async getProfile(request: Request, user: any): Promise<Response> {
    try {
      // Get fresh user data from database using Prisma
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          teacher_id: true,
          status: true,
          created_at: true,
          updated_at: true,
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
          }
        }
      });

      if (!userData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Usuário não encontrado"
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
          data: userData
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );

    } catch (error) {
      console.error("Get profile error:", error);
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

  async logout(request: Request): Promise<Response> {
    // For JWT tokens, logout is handled client-side by removing the token
    // In a more sophisticated system, you might maintain a blacklist of tokens
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Logout realizado com sucesso"
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
} 