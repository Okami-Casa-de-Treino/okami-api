import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";

async function createTestStudent() {
  try {
    console.log("🔐 Creating test student with phone authentication...");
    
    // Check if student already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        phone: "11999999999"
      }
    });

    if (existingStudent) {
      console.log("👤 Test student already exists, skipping...");
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash("student123", saltRounds);

    // Create student with authentication credentials
    const student = await prisma.student.create({
      data: {
        full_name: "Test Student",
        birth_date: new Date("2000-01-01"),
        email: "student@test.com",
        phone: "11999999999",
        cpf: "12345678901",
        belt: "White",
        belt_degree: 1,
        status: "active",
        password_hash: passwordHash
      } as any
    });

    console.log(`✨ Created test student: ${student.full_name}`);
    console.log(`📧 Email: ${student.email}`);
    console.log(`📱 Phone: ${student.phone}`);
    console.log(`🆔 CPF: ${student.cpf}`);
    console.log(`🔑 Password: student123`);
    console.log("");
    console.log("🔐 Authentication options:");
    console.log("   - Phone: 11999999999 + student123");
    console.log("   - CPF: 12345678901 + student123");
    console.log("   - Email: student@test.com + student123");
    console.log("✅ Test student created successfully!");

  } catch (error) {
    console.error("❌ Error creating test student:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestStudent()
  .then(() => {
    console.log("🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }); 