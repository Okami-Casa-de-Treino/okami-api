import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { AuthMiddleware } from "../middleware/auth.js";
import { loginSchema } from "../utils/validation.js";
import type { AuthResponse, StudentAuthResponse } from "../types/index.js";

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

      // First, try to find a staff user
      const staffUser = await prisma.user.findFirst({
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

      if (staffUser) {
        // Verify password for staff user
        const isValidPassword = await bcrypt.compare(password, staffUser.password_hash);
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

        // Generate JWT token for staff user
        const userWithoutPassword = { 
          id: staffUser.id,
          username: staffUser.username,
          email: staffUser.email || undefined,
          role: staffUser.role || 'receptionist',
          teacher_id: staffUser.teacher_id || undefined,
          status: staffUser.status || 'active',
          created_at: staffUser.created_at ? staffUser.created_at.toISOString() : '',
          updated_at: staffUser.updated_at ? staffUser.updated_at.toISOString() : '',
          teacher: staffUser.teacher || undefined
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
      }

      // If no staff user found, try to find a student
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { phone: username },
            { cpf: username },
            { email: username }
          ],
          status: 'active'
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
          // password_hash is not in the type, but is in the DB
          // @ts-ignore
          password_hash: true,
          created_at: true,
          updated_at: true
        } as any // workaround for Prisma type
      });

      if (student && (student as any).password_hash) {
        // Verify password for student
        const isValidPassword = await bcrypt.compare(password, (student as any).password_hash);
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

        // Generate JWT token for student
        const studentWithoutPassword = { 
          id: student.id,
          full_name: student.full_name,
          birth_date: student.birth_date instanceof Date ? student.birth_date.toISOString() : (student.birth_date ?? ''),
          cpf: student.cpf ?? undefined,
          rg: student.rg ?? undefined,
          belt: student.belt ?? undefined,
          belt_degree: student.belt_degree ?? 0,
          address: student.address ?? undefined,
          phone: student.phone ?? undefined,
          email: student.email ?? undefined,
          emergency_contact_name: student.emergency_contact_name ?? undefined,
          emergency_contact_phone: student.emergency_contact_phone ?? undefined,
          emergency_contact_relationship: student.emergency_contact_relationship ?? undefined,
          medical_observations: student.medical_observations ?? undefined,
          photo_url: student.photo_url ?? undefined,
          enrollment_date: student.enrollment_date instanceof Date ? student.enrollment_date.toISOString() : (student.enrollment_date ?? ''),
          monthly_fee: (student.monthly_fee && typeof (student.monthly_fee as any).toNumber === 'function') ? (student.monthly_fee as any).toNumber() : (student.monthly_fee ?? null),
          status: (student.status ?? 'active') as 'active' | 'inactive' | 'suspended',
          created_at: student.created_at instanceof Date ? student.created_at.toISOString() : (student.created_at ?? ''),
          updated_at: student.updated_at instanceof Date ? student.updated_at.toISOString() : (student.updated_at ?? ''),
          role: 'student' as const
        };
          
        const token = AuthMiddleware.generateToken(studentWithoutPassword);

        const response: StudentAuthResponse = {
          token,
          student: studentWithoutPassword
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
      }

      // No user found
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
      // Check if user is a student or staff member
      if (user.role === 'student') {
        // Get fresh student data from database using Prisma
        const studentData = await prisma.student.findUnique({
          where: { id: user.id },
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

        if (!studentData) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Estudante não encontrado"
            }),
            { 
              status: 404, 
              headers: { "Content-Type": "application/json" } 
            }
          );
        }

        // Convert monthly_fee to number if needed
        const studentProfile = {
          ...studentData,
          role: 'student' as const,
          monthly_fee: (studentData.monthly_fee && typeof (studentData.monthly_fee as any).toNumber === 'function') ? (studentData.monthly_fee as any).toNumber() : (studentData.monthly_fee ?? null)
        };

        return new Response(
          JSON.stringify({
            success: true,
            data: studentProfile
          }),
          { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      } else {
        // Get fresh staff user data from database using Prisma
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
    try {
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
    } catch (error) {
      console.error("Logout error:", error);
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

  async getStudentProfile(request: Request, user: any): Promise<Response> {
    try {
      // Get fresh student data from database using Prisma
      const studentData = await prisma.student.findUnique({
        where: { id: user.id },
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
          username: true,
          created_at: true,
          updated_at: true
        } as any
      });

      if (!studentData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Estudante não encontrado"
          }),
          { 
            status: 404, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Convert monthly_fee to number if needed
      const studentProfile = {
        ...studentData,
        role: 'student' as const,
        monthly_fee: (studentData.monthly_fee && typeof (studentData.monthly_fee as any).toNumber === 'function') ? (studentData.monthly_fee as any).toNumber() : (studentData.monthly_fee ?? null)
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: studentProfile,
          message: "Perfil do estudante recuperado com sucesso"
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );

    } catch (error) {
      console.error("Get student profile error:", error);
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

  async changeStudentPassword(request: Request, user: any): Promise<Response> {
    try {
      const body = await request.json();
      const { currentPassword, newPassword } = body as any;

      if (!currentPassword || !newPassword) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Senha atual e nova senha são obrigatórias"
          }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Get student with password hash
      const student = await prisma.student.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          // @ts-ignore
          password_hash: true
        } as any
      });

      if (!student || !(student as any).password_hash) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Estudante não encontrado ou sem senha configurada"
          }),
          { 
            status: 404, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, (student as any).password_hash);
      if (!isValidPassword) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Senha atual incorreta"
          }),
          { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.student.update({
        where: { id: user.id } as any,
        data: { password_hash: newPasswordHash } as any
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Senha alterada com sucesso"
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );

    } catch (error) {
      console.error("Change student password error:", error);
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