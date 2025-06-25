import type { Pool, PoolClient } from "pg";
import { Pool as PgPool } from "pg";
import { v4 as uuidv4 } from "uuid";

export class DatabaseManager {
  private pool: Pool;

  constructor(connectionUrl?: string) {
    const dbUrl = connectionUrl || process.env.DATABASE_URL || "postgres://okami_user:okami_password@localhost:5432/okami_gym";
    
    this.pool = new PgPool({
      connectionString: dbUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.initializeConnection();
  }

  getPool(): Pool {
    return this.pool;
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  private async initializeConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log("✅ Connected to PostgreSQL database");
      client.release();
    } catch (error) {
      console.error("❌ Failed to connect to PostgreSQL:", error);
      throw error;
    }
  }

  // Utility methods
  generateId(): string {
    return uuidv4();
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Seed default admin user
  async seedDefaultUser(): Promise<void> {
    const bcrypt = await import("bcryptjs");
    const client = await this.pool.connect();
    
    try {
      const result = await client.query("SELECT * FROM users WHERE username = $1", ["admin"]);
      
      if (result.rows.length === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const userId = this.generateId();
        
        await client.query(`
          INSERT INTO users (id, username, password_hash, role)
          VALUES ($1, $2, $3, $4)
        `, [userId, "admin", hashedPassword, "admin"]);
        
        console.log("Default admin user created: admin/admin123");
      }
    } finally {
      client.release();
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();
export const db = dbManager.getPool(); 