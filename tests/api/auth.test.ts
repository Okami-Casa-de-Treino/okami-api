import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { TestHelpers } from "../utils/test-helpers.js";

describe("API: Authentication", () => {
  beforeAll(async () => {
    await TestHelpers.setupTestDatabase();
    await TestHelpers.waitForServer();
  });

  afterAll(async () => {
    await TestHelpers.cleanupTestDatabase();
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "admin",
          password: "admin123"
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.user).toBeDefined();
      expect(data.data.user.username).toBe("admin");
      expect(data.data.user.role).toBe("admin");
      expect(data.message).toBe("Login realizado com sucesso");
    });

    it("should reject invalid credentials", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "admin",
          password: "wrongpassword"
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Credenciais inválidas");
    });

    it("should reject non-existent user", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "nonexistent",
          password: "password"
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Credenciais inválidas");
    });

    it("should validate required fields", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "ad", // Too short
          password: "123" // Too short
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Dados inválidos");
      expect(data.details).toBeDefined();
    });

    it("should handle missing fields", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Dados inválidos");
    });
  });

  describe("GET /api/auth/profile", () => {
    it("should get profile with valid token", async () => {
      // First login to get a real token
      const loginResponse = await TestHelpers.makeRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "admin",
          password: "admin123"
        })
      });

      const loginData = await loginResponse.json() as any;
      const token = loginData.data.token;

      // Now use the real token for profile request
      const response = await TestHelpers.makeRequest("/api/auth/profile", {}, token);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.username).toBe("admin");
      expect(data.data.role).toBe("admin");
    });

    it("should reject request without token", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/profile");

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Token de acesso requerido");
    });

    it("should reject request with invalid token", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/profile", {}, "invalid-token");

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Token de acesso requerido");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh token with valid token", async () => {
      const response = await TestHelpers.makeAuthenticatedRequest("/api/auth/refresh", {
        method: "POST"
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.message).toBe("Token renovado com sucesso");
    });

    it("should reject refresh without token", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/refresh", {
        method: "POST"
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Token inválido");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout with valid token", async () => {
      const response = await TestHelpers.makeAuthenticatedRequest("/api/auth/logout", {
        method: "POST"
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it("should reject logout without token", async () => {
      const response = await TestHelpers.makeRequest("/api/auth/logout", {
        method: "POST"
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Token de acesso requerido");
    });
  });
}); 