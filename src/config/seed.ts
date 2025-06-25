import bcrypt from "bcryptjs";
import { dbManager } from "./database.js";

interface SeedUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'receptionist';
}

export class DatabaseSeeder {
  private static readonly DEFAULT_USERS: SeedUser[] = [
    {
      username: "admin",
      email: "admin@okami.gym",
      password: "admin123",
      role: "admin"
    },
    {
      username: "receptionist",
      email: "receptionist@okami.gym", 
      password: "recep123",
      role: "receptionist"
    }
  ];

  /**
   * Create default admin and receptionist users
   */
  static async seedUsers(): Promise<void> {
    console.log("🌱 Starting user seeding...");
    
    const client = await dbManager.getClient();
    
    try {
      for (const userData of this.DEFAULT_USERS) {
        await this.createUserIfNotExists(client, userData);
      }
      
      console.log("✅ User seeding completed successfully!");
    } catch (error) {
      console.error("❌ Error seeding users:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a user if it doesn't already exist
   */
  private static async createUserIfNotExists(client: any, userData: SeedUser): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await client.query(
        "SELECT id, username FROM users WHERE username = $1 OR email = $2",
        [userData.username, userData.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`👤 User '${userData.username}' already exists, skipping...`);
        return;
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Insert new user
      const result = await client.query(`
        INSERT INTO users (username, email, password_hash, role, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING id, username, email, role
      `, [
        userData.username,
        userData.email,
        passwordHash,
        userData.role
      ]);

      const newUser = result.rows[0];
      console.log(`✨ Created ${userData.role} user: ${newUser.username} (${newUser.email})`);

    } catch (error) {
      console.error(`❌ Error creating user '${userData.username}':`, error);
      throw error;
    }
  }

  /**
   * Seed sample data for development/testing
   */
  static async seedSampleData(): Promise<void> {
    console.log("🌱 Starting sample data seeding...");
    
    const client = await dbManager.getClient();
    
    try {
      // Check if sample data already exists
      const studentCount = await client.query("SELECT COUNT(*) FROM students");
      if (parseInt(studentCount.rows[0].count) > 0) {
        console.log("📊 Sample data already exists, skipping...");
        return;
      }

      // Create sample teacher
      const teacherResult = await client.query(`
        INSERT INTO teachers (full_name, email, phone, specialties, hourly_rate, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        RETURNING id
      `, [
        "Carlos Silva",
        "carlos@okami.gym",
        "11999999999",
        JSON.stringify(["Jiu-Jitsu", "Muay Thai"]),
        50.00
      ]);
      
      const teacherId = teacherResult.rows[0].id;
      console.log("👨‍🏫 Created sample teacher: Carlos Silva");

      // Create sample students
      const sampleStudents = [
        {
          name: "João Santos",
          email: "joao@email.com",
          phone: "11888888888",
          cpf: "12345678901"
        },
        {
          name: "Maria Oliveira", 
          email: "maria@email.com",
          phone: "11777777777",
          cpf: "10987654321"
        }
      ];

      const studentIds: string[] = [];
      
      for (const student of sampleStudents) {
        const studentResult = await client.query(`
          INSERT INTO students (full_name, email, phone, cpf, monthly_fee, status)
          VALUES ($1, $2, $3, $4, $5, 'active')
          RETURNING id
        `, [
          student.name,
          student.email,
          student.phone,
          student.cpf,
          150.00
        ]);
        
        studentIds.push(studentResult.rows[0].id);
        console.log(`👥 Created sample student: ${student.name}`);
      }

      // Create sample class
      const classResult = await client.query(`
        INSERT INTO classes (name, description, teacher_id, day_of_week, start_time, end_time, max_students, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
        RETURNING id
      `, [
        "Jiu-Jitsu Iniciante",
        "Aula de Jiu-Jitsu para iniciantes",
        teacherId,
        1, // Monday
        "19:00",
        "20:30",
        20
      ]);
      
      const classId = classResult.rows[0].id;
      console.log("🥋 Created sample class: Jiu-Jitsu Iniciante");

      // Enroll students in class
      for (const studentId of studentIds) {
        await client.query(`
          INSERT INTO student_classes (student_id, class_id, status)
          VALUES ($1, $2, 'active')
        `, [studentId, classId]);
      }
      
      console.log("📝 Enrolled students in sample class");

      // Create sample payments
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
      
      for (const studentId of studentIds) {
        await client.query(`
          INSERT INTO payments (student_id, amount, due_date, reference_month, status)
          VALUES ($1, $2, $3, $4, 'pending')
        `, [
          studentId,
          150.00,
          nextMonth.toISOString().split('T')[0],
          currentDate.toISOString().split('T')[0].substring(0, 7) + '-01'
        ]);
      }
      
      console.log("💰 Created sample payments");
      console.log("✅ Sample data seeding completed successfully!");

    } catch (error) {
      console.error("❌ Error seeding sample data:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all seeding operations
   */
  static async seedAll(): Promise<void> {
    try {
      await this.seedUsers();
      
      // Only seed sample data in development
      if (process.env.NODE_ENV !== 'production') {
        await this.seedSampleData();
      }
      
      console.log("🎉 Database seeding completed!");
    } catch (error) {
      console.error("💥 Database seeding failed:", error);
      process.exit(1);
    }
  }

  /**
   * Create a new admin user
   */
  static async createAdmin(username: string, email: string, password: string): Promise<void> {
    console.log(`🔐 Creating admin user: ${username}`);
    
    const client = await dbManager.getClient();
    
    try {
      await this.createUserIfNotExists(client, {
        username,
        email,
        password,
        role: 'admin'
      });
      
      console.log("✅ Admin user created successfully!");
    } catch (error) {
      console.error("❌ Error creating admin user:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reset database (DANGER: This will delete all data!)
   */
  static async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("Database reset is not allowed in production!");
    }

    console.log("⚠️  RESETTING DATABASE - ALL DATA WILL BE LOST!");
    
    const client = await dbManager.getClient();
    
    try {
      // Delete all data in correct order (respecting foreign keys)
      await client.query("DELETE FROM checkins");
      await client.query("DELETE FROM payments");
      await client.query("DELETE FROM student_classes");
      await client.query("DELETE FROM classes");
      await client.query("DELETE FROM students");
      await client.query("DELETE FROM users WHERE teacher_id IS NOT NULL");
      await client.query("DELETE FROM teachers");
      await client.query("DELETE FROM users");
      
      console.log("🗑️  All data deleted");
      
      // Re-seed
      await this.seedAll();
      
    } catch (error) {
      console.error("❌ Error resetting database:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// CLI interface
if (import.meta.main || process.argv[1]?.endsWith('seed.ts')) {
  const command = process.argv[2];
  
  switch (command) {
    case 'users':
      await DatabaseSeeder.seedUsers();
      break;
    case 'sample':
      await DatabaseSeeder.seedSampleData();
      break;
    case 'all':
      await DatabaseSeeder.seedAll();
      break;
    case 'reset':
      await DatabaseSeeder.resetDatabase();
      break;
    case 'admin':
      const username = process.argv[3] || 'admin';
      const email = process.argv[4] || 'admin@okami.gym';
      const password = process.argv[5] || 'admin123';
      await DatabaseSeeder.createAdmin(username, email, password);
      break;
    default:
      console.log(`
🌱 Okami Gym Database Seeder

Usage: bun run src/config/seed.ts <command>

Commands:
  users   - Create default admin and receptionist users
  sample  - Create sample data for development
  all     - Run all seeding operations
  reset   - Reset database and re-seed (development only)
  admin   - Create admin user (optional: username email password)

Examples:
  bun run src/config/seed.ts users
  bun run src/config/seed.ts all
  bun run src/config/seed.ts admin myuser admin@gym.com mypassword
      `);
  }
  
  process.exit(0);
} 