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
      if (newUser) {
        console.log(`✨ Created ${userData.role} user: ${newUser.username} (${newUser.email})`);
      }

    } catch (error) {
      console.error(`❌ Error creating user '${userData.username}':`, error);
      throw error;
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
   * Run all seeding operations
   */
  static async seedAll(): Promise<void> {
    try {
      await this.seedUsers();
      console.log("🎉 Database seeding completed!");
    } catch (error) {
      console.error("💥 Database seeding failed:", error);
      process.exit(1);
    }
  }
}

// Simple CLI runner
async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'users':
        await DatabaseSeeder.seedUsers();
        break;
      case 'all':
        await DatabaseSeeder.seedAll();
        break;
      case 'admin':
        const username = args[1] || 'admin';
        const email = args[2] || 'admin@okami.gym';
        const password = args[3] || 'admin123';
        await DatabaseSeeder.createAdmin(username, email, password);
        break;
      default:
        console.log(`
🌱 Okami Gym Database Seeder (Simple)

Usage: bun run src/config/seed-simple.ts <command>

Commands:
  users   - Create default admin and receptionist users
  all     - Run all seeding operations
  admin   - Create admin user (optional: username email password)

Examples:
  bun run src/config/seed-simple.ts users
  bun run src/config/seed-simple.ts all
  bun run src/config/seed-simple.ts admin myuser admin@gym.com mypassword
        `);
    }
  } catch (error) {
    console.error("Command failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Check if this file is being run directly
const currentFile = import.meta.url;
const isMainModule = process.argv[1] && currentFile.includes(process.argv[1]);

if (isMainModule) {
  runCLI();
} 