import { dbManager } from "../../src/config/database.js";
import { AuthMiddleware } from "../../src/middleware/auth.js";
import type { User } from "../../src/types/index.js";

export class TestHelpers {
  private static testDbInitialized = false;

  // Database setup and cleanup
  static async setupTestDatabase() {
    if (!this.testDbInitialized) {
      await dbManager.seedDefaultUser();
      this.testDbInitialized = true;
    }
  }

  static async cleanupTestDatabase() {
    const client = await dbManager.getClient();
    try {
      // Clean up test data (keep default admin user)
      await client.query("DELETE FROM checkins WHERE student_id NOT IN (SELECT id FROM users WHERE username = 'admin')");
      await client.query("DELETE FROM payments WHERE student_id NOT IN (SELECT id FROM users WHERE username = 'admin')");
      await client.query("DELETE FROM student_classes WHERE student_id NOT IN (SELECT id FROM users WHERE username = 'admin')");
      await client.query("DELETE FROM classes WHERE teacher_id NOT IN (SELECT id FROM users WHERE username = 'admin')");
      await client.query("DELETE FROM students WHERE id NOT IN (SELECT id FROM users WHERE username = 'admin')");
      await client.query("DELETE FROM teachers WHERE id NOT IN (SELECT id FROM users WHERE username = 'admin')");
      await client.query("DELETE FROM users WHERE username != 'admin' AND username != 'receptionist'");
    } finally {
      client.release();
    }
  }

  // Authentication helpers
  static async getAdminToken(): Promise<string> {
    const adminUser: Omit<User, 'password_hash'> = {
      id: "test-admin-id",
      username: "admin",
      email: undefined,
      role: "admin",
      teacher_id: undefined,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return AuthMiddleware.generateToken(adminUser);
  }

  static async getTeacherToken(): Promise<string> {
    const teacherUser: Omit<User, 'password_hash'> = {
      id: "test-teacher-id",
      username: "teacher",
      email: "teacher@test.com",
      role: "teacher",
      teacher_id: "test-teacher-id",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return AuthMiddleware.generateToken(teacherUser);
  }

  static async getReceptionistToken(): Promise<string> {
    const receptionistUser: Omit<User, 'password_hash'> = {
      id: "test-receptionist-id",
      username: "receptionist",
      email: "receptionist@test.com",
      role: "receptionist",
      teacher_id: undefined,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return AuthMiddleware.generateToken(receptionistUser);
  }

  // HTTP request helpers
  static async makeRequest(
    url: string,
    options: RequestInit = {},
    token?: string
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`http://localhost:3000${url}`, {
      ...options,
      headers
    });
  }

  static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
    role: 'admin' | 'teacher' | 'receptionist' = 'admin'
  ): Promise<Response> {
    let token: string;
    switch (role) {
      case 'admin':
        token = await this.getAdminToken();
        break;
      case 'teacher':
        token = await this.getTeacherToken();
        break;
      case 'receptionist':
        token = await this.getReceptionistToken();
        break;
    }

    return this.makeRequest(url, options, token);
  }

  // Test data generators
  static generateStudentData(overrides: Partial<any> = {}) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return {
      full_name: "Test Student",
      birth_date: "1990-01-15",
      cpf: `${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      phone: `11${timestamp.toString().slice(-8)}`,
      // email is now optional - only include if explicitly provided in overrides
      emergency_contact_name: "Emergency Contact",
      emergency_contact_phone: "11888888888",
      emergency_contact_relationship: "Parent",
      medical_observations: "None",
      // monthly_fee is now optional - only include if explicitly provided in overrides
      ...overrides
    };
  }

  static generateTeacherData(overrides: Partial<any> = {}) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return {
      full_name: "Test Teacher",
      birth_date: "1985-01-01",
      cpf: `${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      phone: `11${timestamp.toString().slice(-8)}`,
      email: `test.teacher.${timestamp}.${random}@test.com`,
      belt: "Black",
      belt_degree: 3,
      specialties: ["Karate", "Self Defense"],
      hourly_rate: 50.00,
      ...overrides
    };
  }

  static generateClassData(teacherId: string, overrides: Partial<any> = {}) {
    return {
      name: "Test Class",
      description: "Test class description",
      teacher_id: teacherId,
      days_of_week: [1], // Monday
      start_time: "18:00",
      end_time: "19:00",
      max_students: 20,
      belt_requirement: "White",
      age_group: "Adult",
      ...overrides
    };
  }

  static generatePaymentData(studentId: string, overrides: Partial<any> = {}) {
    return {
      student_id: studentId,
      amount: 150.00,
      due_date: "2024-12-31",
      reference_month: "2024-12",
      discount: 0,
      notes: "Test Payment",
      ...overrides
    };
  }

  // Wait for server to be ready
  static async waitForServer(maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch("http://localhost:3000/health");
        if (response.ok) {
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error("Server did not start within expected time");
  }
} 