import { describe, it, expect } from "bun:test";
import {
  createStudentSchema,
  updateStudentSchema,
  createTeacherSchema,
  updateTeacherSchema,
  createClassSchema,
  updateClassSchema,
  createCheckinSchema,
  createPaymentSchema,
  updatePaymentSchema,
  loginSchema,
  createUserSchema,
  paginationSchema,
  dateRangeSchema,
  validateUUID,
  validateCPF,
  formatCPF,
  formatPhone
} from "../../src/utils/validation.js";

describe("Unit: Validation Schemas", () => {
  describe("createStudentSchema", () => {
    it("should validate valid student data", () => {
      const validData = {
        full_name: "João Silva",
        birth_date: "1990-01-15",
        cpf: "12345678901",
        phone: "11999999999",
        email: "joao@email.com"
      };

      const result = createStudentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject student with short name", () => {
      const invalidData = {
        full_name: "J",
        birth_date: "1990-01-15"
      };

      const result = createStudentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("pelo menos 2 caracteres");
      }
    });

    it("should reject invalid birth date format", () => {
      const invalidData = {
        full_name: "João Silva",
        birth_date: "15/01/1990"
      };

      const result = createStudentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("YYYY-MM-DD");
      }
    });

    it("should reject invalid CPF format", () => {
      const invalidData = {
        full_name: "João Silva",
        birth_date: "1990-01-15",
        cpf: "123.456.789-01"
      };

      const result = createStudentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("apenas 11 dígitos");
      }
    });

    it("should reject invalid phone format", () => {
      const invalidData = {
        full_name: "João Silva",
        birth_date: "1990-01-15",
        phone: "(11) 99999-9999"
      };

      const result = createStudentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("apenas dígitos");
      }
    });

    it("should reject invalid email", () => {
      const invalidData = {
        full_name: "João Silva",
        birth_date: "1990-01-15",
        email: "invalid-email"
      };

      const result = createStudentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Email inválido");
      }
    });

    it("should accept optional fields as undefined", () => {
      const minimalData = {
        full_name: "João Silva",
        birth_date: "1990-01-15"
      };

      const result = createStudentSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe("createTeacherSchema", () => {
    it("should validate valid teacher data", () => {
      const validData = {
        full_name: "Carlos Instrutor",
        email: "carlos@email.com",
        phone: "11888888888",
        belt: "Preta",
        belt_degree: 3,
        hourly_rate: 50.00
      };

      const result = createTeacherSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid belt degree", () => {
      const invalidData = {
        full_name: "Carlos Instrutor",
        belt_degree: 15
      };

      const result = createTeacherSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative hourly rate", () => {
      const invalidData = {
        full_name: "Carlos Instrutor",
        hourly_rate: -10
      };

      const result = createTeacherSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("createClassSchema", () => {
    it("should validate valid class data", () => {
      const validData = {
        name: "Karatê Infantil",
        description: "Aula de karatê para crianças",
        day_of_week: 1,
        start_time: "18:00",
        end_time: "19:00",
        max_students: 20
      };

      const result = createClassSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid day of week", () => {
      const invalidData = {
        name: "Karatê Infantil",
        day_of_week: 8,
        start_time: "18:00",
        end_time: "19:00"
      };

      const result = createClassSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid time format", () => {
      const invalidData = {
        name: "Karatê Infantil",
        day_of_week: 1,
        start_time: "6:00 PM",
        end_time: "19:00"
      };

      const result = createClassSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate valid login data", () => {
      const validData = {
        username: "admin",
        password: "admin123"
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject short username", () => {
      const invalidData = {
        username: "ad",
        password: "admin123"
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const invalidData = {
        username: "admin",
        password: "123"
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("paginationSchema", () => {
    it("should parse valid pagination params", () => {
      const validData = {
        page: "2",
        limit: "20",
        search: "test",
        sort: "name",
        order: "desc" as const
      };

      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should use default values", () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should limit maximum page size", () => {
      const result = paginationSchema.safeParse({ limit: "200" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });
  });
});

describe("Unit: Validation Utilities", () => {
  describe("validateUUID", () => {
    it("should validate correct UUID", () => {
      const validUUID = "123e4567-e89b-42d3-a456-426614174000";
      expect(validateUUID(validUUID)).toBe(true);
    });

    it("should reject invalid UUID", () => {
      expect(validateUUID("not-a-uuid")).toBe(false);
      expect(validateUUID("123e4567-e89b-12d3-a456")).toBe(false);
      expect(validateUUID("")).toBe(false);
    });
  });

  describe("validateCPF", () => {
    it("should validate correct CPF", () => {
      expect(validateCPF("11144477735")).toBe(true);
      expect(validateCPF("111.444.777-35")).toBe(true);
    });

    it("should reject invalid CPF", () => {
      expect(validateCPF("11111111111")).toBe(false); // All same digits
      expect(validateCPF("12345678901")).toBe(false); // Invalid check digits
      expect(validateCPF("123456789")).toBe(false); // Too short
      expect(validateCPF("")).toBe(false); // Empty
    });
  });

  describe("formatCPF", () => {
    it("should format CPF correctly", () => {
      expect(formatCPF("11144477735")).toBe("111.444.777-35");
      expect(formatCPF("111.444.777-35")).toBe("111.444.777-35");
    });

    it("should handle empty CPF", () => {
      expect(formatCPF("")).toBe("");
      expect(formatCPF("123")).toBe("123");
    });
  });

  describe("formatPhone", () => {
    it("should format 11-digit phone", () => {
      expect(formatPhone("11999999999")).toBe("(11) 99999-9999");
    });

    it("should format 10-digit phone", () => {
      expect(formatPhone("1199999999")).toBe("(11) 9999-9999");
    });

    it("should handle already formatted phone", () => {
      expect(formatPhone("(11) 99999-9999")).toBe("(11) 99999-9999");
    });

    it("should handle invalid phone", () => {
      expect(formatPhone("123")).toBe("123");
      expect(formatPhone("")).toBe("");
    });
  });
}); 