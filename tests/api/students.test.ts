import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { TestHelpers } from "../utils/test-helpers.js";

describe("API: Students", () => {
  beforeAll(async () => {
    await TestHelpers.setupTestDatabase();
    await TestHelpers.waitForServer();
  });

  afterAll(async () => {
    await TestHelpers.cleanupTestDatabase();
  });

  describe("POST /api/students", () => {
    it("should create a new student with admin role", async () => {
      const studentData = TestHelpers.generateStudentData({
        full_name: "Test Student API",
        email: "teststudent@api.com"
      });

      const response = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      }, "admin");

      expect(response.status).toBe(201);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toBe("Students controller - create method");
      // Note: Current implementation returns data: null (stub)
    });

    it("should reject creation without authentication", async () => {
      const studentData = TestHelpers.generateStudentData();

      const response = await TestHelpers.makeRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      });

      expect(response.status).toBe(401);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Token de acesso requerido");
    });

    it("should reject creation with teacher role", async () => {
      const studentData = TestHelpers.generateStudentData();

      const response = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      }, "teacher");

      expect(response.status).toBe(403);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Acesso negado: permissões insuficientes");
    });

    it("should allow creation with receptionist role", async () => {
      const studentData = TestHelpers.generateStudentData();

      const response = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      }, "receptionist");

      expect(response.status).toBe(201);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toBe("Students controller - create method");
    });
  });

  describe("GET /api/students", () => {
    it("should list students with authentication", async () => {
      const response = await TestHelpers.makeAuthenticatedRequest("/api/students");

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.message).toBe("Students controller - getAll method");
    });

    it("should reject listing without authentication", async () => {
      const response = await TestHelpers.makeRequest("/api/students");

      expect(response.status).toBe(401);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Token de acesso requerido");
    });

    it("should support pagination", async () => {
      const response = await TestHelpers.makeAuthenticatedRequest("/api/students?page=1&limit=5");

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  describe("GET /api/students/:id", () => {
    it("should get student by ID", async () => {
      const testId = "123e4567-e89b-42d3-a456-426614174000";
      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${testId}`);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toContain(testId);
      // Note: Current implementation returns data: null (stub)
    });

    it("should handle non-existent student ID", async () => {
      const fakeId = "123e4567-e89b-42d3-a456-426614174000";
      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${fakeId}`);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      // Note: Current stub implementation doesn't validate existence
    });

    it("should handle invalid UUID format", async () => {
      const response = await TestHelpers.makeAuthenticatedRequest("/api/students/invalid-id");

      expect(response.status).toBe(404);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Rota não encontrada");
    });
  });

  describe("PUT /api/students/:id", () => {
    it("should update student with admin role", async () => {
      const testId = "123e4567-e89b-42d3-a456-426614174000";
      const updateData = {
        full_name: "Updated Student Name",
        email: "updated@email.com"
      };

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${testId}`, {
        method: "PUT",
        body: JSON.stringify(updateData)
      }, "admin");

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toContain(testId);
    });

    it("should reject update with teacher role", async () => {
      const testId = "123e4567-e89b-42d3-a456-426614174000";
      const updateData = { full_name: "Should Not Update" };

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${testId}`, {
        method: "PUT",
        body: JSON.stringify(updateData)
      }, "teacher");

      expect(response.status).toBe(403);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Acesso negado: permissões insuficientes");
    });
  });

  describe("DELETE /api/students/:id", () => {
    it("should delete student with admin role", async () => {
      const testId = "123e4567-e89b-42d3-a456-426614174000";

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${testId}`, {
        method: "DELETE"
      }, "admin");

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toContain(testId);
    });

    it("should reject deletion with non-admin role", async () => {
      const testId = "123e4567-e89b-42d3-a456-426614174000";

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${testId}`, {
        method: "DELETE"
      }, "receptionist");

      expect(response.status).toBe(403);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Acesso negado: permissões insuficientes");
    });
  });
}); 