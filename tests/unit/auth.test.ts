import { describe, it, expect, beforeAll } from "bun:test";
import { AuthMiddleware } from "../../src/middleware/auth.js";
import type { User } from "../../src/types/index.js";

describe("Unit: AuthMiddleware", () => {
  const mockUser: Omit<User, 'password_hash'> = {
    id: "test-user-id",
    username: "testuser",
    email: "test@example.com",
    role: "admin",
    teacher_id: undefined,
    status: "active",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z"
  };

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const token = AuthMiddleware.generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should include user data in token payload", () => {
      const token = AuthMiddleware.generateToken(mockUser);
      const payload = AuthMiddleware.verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.username).toBe(mockUser.username);
      expect(payload?.role).toBe(mockUser.role);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = AuthMiddleware.generateToken(mockUser);
      const payload = AuthMiddleware.verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.username).toBe(mockUser.username);
      expect(payload?.role).toBe(mockUser.role);
      expect(payload?.iat).toBeDefined();
      expect(payload?.exp).toBeDefined();
    });

    it("should return null for invalid token", () => {
      const payload = AuthMiddleware.verifyToken("invalid-token");
      expect(payload).toBeNull();
    });

    it("should return null for malformed token", () => {
      const payload = AuthMiddleware.verifyToken("not.a.jwt");
      expect(payload).toBeNull();
    });

    it("should return null for empty token", () => {
      const payload = AuthMiddleware.verifyToken("");
      expect(payload).toBeNull();
    });
  });

  describe("getUserFromRequest", () => {
    it("should extract user from valid Authorization header", async () => {
      const token = AuthMiddleware.generateToken(mockUser);
      const mockRequest = new Request("http://localhost:3000/test", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const user = await AuthMiddleware.getUserFromRequest(mockRequest);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(mockUser.id);
      expect(user?.username).toBe(mockUser.username);
      expect(user?.role).toBe(mockUser.role);
    });

    it("should return null for missing Authorization header", async () => {
      const mockRequest = new Request("http://localhost:3000/test");
      const user = await AuthMiddleware.getUserFromRequest(mockRequest);
      
      expect(user).toBeNull();
    });

    it("should return null for malformed Authorization header", async () => {
      const mockRequest = new Request("http://localhost:3000/test", {
        headers: {
          "Authorization": "InvalidFormat token"
        }
      });

      const user = await AuthMiddleware.getUserFromRequest(mockRequest);
      expect(user).toBeNull();
    });

    it("should return null for Bearer without token", async () => {
      const mockRequest = new Request("http://localhost:3000/test", {
        headers: {
          "Authorization": "Bearer"
        }
      });

      const user = await AuthMiddleware.getUserFromRequest(mockRequest);
      expect(user).toBeNull();
    });

    it("should return null for Bearer with empty token", async () => {
      const mockRequest = new Request("http://localhost:3000/test", {
        headers: {
          "Authorization": "Bearer "
        }
      });

      const user = await AuthMiddleware.getUserFromRequest(mockRequest);
      expect(user).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const mockRequest = new Request("http://localhost:3000/test", {
        headers: {
          "Authorization": "Bearer invalid-token"
        }
      });

      const user = await AuthMiddleware.getUserFromRequest(mockRequest);
      expect(user).toBeNull();
    });
  });

  describe("token expiration", () => {
    it("should create tokens with expiration", () => {
      const token = AuthMiddleware.generateToken(mockUser);
      const payload = AuthMiddleware.verifyToken(token);
      
      expect(payload?.exp).toBeDefined();
      expect(payload?.iat).toBeDefined();
      
      // Token should expire in the future
      const now = Math.floor(Date.now() / 1000);
      expect(payload!.exp!).toBeGreaterThan(now);
    });
  });

  describe("role handling", () => {
    it("should handle admin role", () => {
      const adminUser = { ...mockUser, role: "admin" as const };
      const token = AuthMiddleware.generateToken(adminUser);
      const payload = AuthMiddleware.verifyToken(token);
      
      expect(payload?.role).toBe("admin");
    });

    it("should handle teacher role", () => {
      const teacherUser = { ...mockUser, role: "teacher" as const };
      const token = AuthMiddleware.generateToken(teacherUser);
      const payload = AuthMiddleware.verifyToken(token);
      
      expect(payload?.role).toBe("teacher");
    });

    it("should handle receptionist role", () => {
      const receptionistUser = { ...mockUser, role: "receptionist" as const };
      const token = AuthMiddleware.generateToken(receptionistUser);
      const payload = AuthMiddleware.verifyToken(token);
      
      expect(payload?.role).toBe("receptionist");
    });
  });
}); 