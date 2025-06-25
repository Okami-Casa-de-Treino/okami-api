import bcrypt from "bcryptjs";
import { dbManager } from "../config/database.js";
import { AuthMiddleware } from "../middleware/auth.js";
import { loginSchema } from "../utils/validation.js";
import type { User, AuthResponse, ApiResponse } from "../types/index.js";

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
      const client = await dbManager.getClient();

      try {
        // Find user by username
        const userResult = await client.query(
          "SELECT * FROM users WHERE username = $1 AND status = 'active'",
          [username]
        );

        if (userResult.rows.length === 0) {
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

        const user = userResult.rows[0] as User;

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
        const userWithoutPassword = { ...user };
        delete (userWithoutPassword as any).password_hash;
        
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

      } finally {
        client.release();
      }

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
      const client = await dbManager.getClient();

      try {
        // Get fresh user data from database
        const userResult = await client.query(
          "SELECT id, username, email, role, teacher_id, status, created_at, updated_at FROM users WHERE id = $1",
          [user.id]
        );

        if (userResult.rows.length === 0) {
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

        const userData = userResult.rows[0];

        // If user is a teacher, get teacher info
        if (userData.teacher_id) {
          const teacherResult = await client.query(
            "SELECT full_name, email, phone FROM teachers WHERE id = $1",
            [userData.teacher_id]
          );

          if (teacherResult.rows.length > 0) {
            userData.teacher_info = teacherResult.rows[0];
          }
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

      } finally {
        client.release();
      }

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