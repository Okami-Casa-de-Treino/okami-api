import jwt from "jsonwebtoken";
import type { User, Student } from "../types/index.js";

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password_hash'> | Omit<Student, 'password_hash'>;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthMiddleware {
  private static JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

  static generateToken(user: Omit<User, 'password_hash'> | (Omit<Student, 'password_hash'> & { role: 'student' })): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username || '',
      role: user.role,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  static authenticate() {
    return async (req: AuthenticatedRequest): Promise<Response | void> => {
      const authHeader = req.headers.get("authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Token de acesso requerido" 
          }),
          { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix
      const payload = this.verifyToken(token);

      if (!payload) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Token inválido ou expirado" 
          }),
          { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Attach user info to request (this would need to be handled differently in Bun.serve)
      if (payload.role === 'student') {
        req.user = {
          id: payload.userId,
          username: payload.username,
          role: payload.role as 'student',
          full_name: '',
          birth_date: new Date().toISOString(),
          belt_degree: 0,
          status: 'active',
          created_at: '',
          updated_at: ''
        } as Omit<Student, 'password_hash'>;
      } else {
        req.user = {
          id: payload.userId,
          username: payload.username,
          role: payload.role as 'admin' | 'teacher' | 'receptionist',
          email: undefined,
          teacher_id: undefined,
          status: 'active',
          created_at: '',
          updated_at: ''
        } as Omit<User, 'password_hash'>;
      }

      return; // Continue to next handler
    };
  }

  static requireRole(roles: string[]) {
    return async (req: AuthenticatedRequest): Promise<Response | void> => {
      if (!req.user) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Usuário não autenticado" 
          }),
          { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      if (!roles.includes(req.user.role)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Acesso negado: permissões insuficientes" 
          }),
          { 
            status: 403, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      return; // Continue to next handler
    };
  }

  static requireAdmin() {
    return this.requireRole(['admin']);
  }

  static requireAdminOrTeacher() {
    return this.requireRole(['admin', 'teacher']);
  }

  static requireStudent() {
    return this.requireRole(['student']);
  }

  static requireStaff() {
    return this.requireRole(['admin', 'teacher', 'receptionist']);
  }

  // Helper function to extract user from request in route handlers
  static async getUserFromRequest(req: Request): Promise<Omit<User, 'password_hash'> | Omit<Student, 'password_hash'> | null> {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    
    if (!token || token.trim().length === 0) {
      return null;
    }
    
    const payload = this.verifyToken(token);

    if (!payload) {
      return null;
    }

    if (payload.role === 'student') {
      return {
        id: payload.userId,
        username: payload.username,
        role: payload.role as 'student',
        full_name: '',
        birth_date: new Date().toISOString(),
        belt_degree: 0,
        status: 'active' as 'active' | 'inactive' | 'suspended',
        created_at: '',
        updated_at: ''
      } as Omit<Student, 'password_hash'>;
    } else {
      return {
        id: payload.userId,
        username: payload.username,
        role: payload.role as 'admin' | 'teacher' | 'receptionist',
        email: undefined,
        teacher_id: undefined,
        status: 'active' as 'active' | 'inactive',
        created_at: '',
        updated_at: ''
      } as Omit<User, 'password_hash'>;
    }
  }
} 