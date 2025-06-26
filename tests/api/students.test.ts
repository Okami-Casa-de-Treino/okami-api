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
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.full_name).toBe(studentData.full_name);
      expect(data.data.email).toBe(studentData.email);
      expect(data.message).toBe("Aluno criado com sucesso");
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
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.message).toBe("Aluno criado com sucesso");
    });

    it("should reject duplicate email", async () => {
      const studentData1 = TestHelpers.generateStudentData({
        email: "duplicate@test.com",
        phone: "11999999991"
      });
      const studentData2 = TestHelpers.generateStudentData({
        email: "duplicate@test.com", // Same email
        phone: "11999999992", // Different phone
        cpf: "98765432100" // Different CPF
      });

      // Create first student
      const response1 = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData1)
      }, "admin");
      expect(response1.status).toBe(201);

      // Try to create second student with same email
      const response2 = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData2)
      }, "admin");
      expect(response2.status).toBe(409);
      const data2 = await response2.json() as any;
      expect(data2.success).toBe(false);
      expect(data2.error).toBe("Email já cadastrado");
    });

    it("should reject duplicate phone", async () => {
      const studentData1 = TestHelpers.generateStudentData({
        email: "unique1@test.com",
        phone: "11999999993"
      });
      const studentData2 = TestHelpers.generateStudentData({
        email: "unique2@test.com", // Different email
        phone: "11999999993", // Same phone
        cpf: "98765432101" // Different CPF
      });

      // Create first student
      const response1 = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData1)
      }, "admin");
      expect(response1.status).toBe(201);

      // Try to create second student with same phone
      const response2 = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData2)
      }, "admin");
      expect(response2.status).toBe(409);
      const data2 = await response2.json() as any;
      expect(data2.success).toBe(false);
      expect(data2.error).toBe("Telefone já cadastrado");
    });

    it("should reject duplicate CPF", async () => {
      const studentData1 = TestHelpers.generateStudentData({
        email: "unique3@test.com",
        phone: "11999999994",
        cpf: "12345678901"
      });
      const studentData2 = TestHelpers.generateStudentData({
        email: "unique4@test.com", // Different email
        phone: "11999999995", // Different phone
        cpf: "12345678901" // Same CPF
      });

      // Create first student
      const response1 = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData1)
      }, "admin");
      expect(response1.status).toBe(201);

      // Try to create second student with same CPF
      const response2 = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData2)
      }, "admin");
      expect(response2.status).toBe(409);
      const data2 = await response2.json() as any;
      expect(data2.success).toBe(false);
      expect(data2.error).toBe("CPF já cadastrado");
    });

    it("should create student without monthly_fee (optional field)", async () => {
      const studentData = TestHelpers.generateStudentData({
        full_name: "Student Without Fee",
        email: "nofee@test.com",
        phone: "11999999996"
        // Note: monthly_fee is intentionally omitted
      });

      const response = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      }, "admin");

      expect(response.status).toBe(201);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.full_name).toBe(studentData.full_name);
      expect(data.data.monthly_fee).toBeNull(); // Should be null when not provided
      expect(data.message).toBe("Aluno criado com sucesso");
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
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBeDefined();
      expect(data.pagination.limit).toBeDefined();
      expect(data.pagination.total).toBeDefined();
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
      expect(data.pagination.limit).toBe(5);
      expect(data.pagination.page).toBe(1);
    });
  });

  describe("GET /api/students/:id", () => {
    it("should get student by ID", async () => {
      // First create a student to test with
      const studentData = TestHelpers.generateStudentData({
        full_name: "Student for ID Test",
        email: "idtest@example.com"
      });

      const createResponse = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      }, "admin");

      const createData = await createResponse.json() as any;
      const studentId = createData.data.id;

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${studentId}`);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe(studentId);
      expect(data.data.full_name).toBe(studentData.full_name);
    });

    it("should handle non-existent student ID", async () => {
      const fakeId = "123e4567-e89b-42d3-a456-426614174000";
      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${fakeId}`);

      expect(response.status).toBe(404);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Aluno não encontrado");
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
      // First create a student to test with
      const studentData = TestHelpers.generateStudentData({
        full_name: "Student for Update Test",
        email: "updatetest@example.com"
      });

      const createResponse = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      }, "admin");

      const createData = await createResponse.json() as any;
      const studentId = createData.data.id;

      const updateData = {
        full_name: "Updated Student Name",
        email: "updated@email.com"
      };

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${studentId}`, {
        method: "PUT",
        body: JSON.stringify(updateData)
      }, "admin");

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.full_name).toBe(updateData.full_name);
      expect(data.data.email).toBe(updateData.email);
      expect(data.message).toBe("Aluno atualizado com sucesso");
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
      // First create a student to test with
      const studentData = TestHelpers.generateStudentData({
        full_name: "Student for Delete Test",
        email: "deletetest@example.com"
      });

      const createResponse = await TestHelpers.makeAuthenticatedRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData)
      }, "admin");

      const createData = await createResponse.json() as any;
      const studentId = createData.data.id;

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${studentId}`, {
        method: "DELETE"
      }, "admin");

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toBe("Aluno removido com sucesso");

      // Verify student was deleted
      const getResponse = await TestHelpers.makeAuthenticatedRequest(`/api/students/${studentId}`);
      expect(getResponse.status).toBe(404);
    });

    it("should reject deletion with non-admin role", async () => {
      const testId = "123e4567-e89b-42d3-a456-426614174000";

      const response = await TestHelpers.makeAuthenticatedRequest(`/api/students/${testId}`, {
        method: "DELETE"
      }, "teacher");

      expect(response.status).toBe(403);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Acesso negado: permissões insuficientes");
    });
  });
}); 