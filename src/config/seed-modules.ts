import { prisma } from "./prisma.js";

const defaultModules = [
  {
    name: "Técnicas Básicas",
    description: "Fundamentos das artes marciais",
    color: "#3B82F6",
    order_index: 1
  },
  {
    name: "Técnicas Avançadas",
    description: "Técnicas avançadas para alunos experientes",
    color: "#EF4444",
    order_index: 2
  },
  {
    name: "Defesa Pessoal",
    description: "Técnicas de defesa pessoal e autoproteção",
    color: "#10B981",
    order_index: 3
  },
  {
    name: "Competição",
    description: "Técnicas específicas para competições",
    color: "#F59E0B",
    order_index: 4
  },
  {
    name: "Filosofia",
    description: "Princípios filosóficos das artes marciais",
    color: "#8B5CF6",
    order_index: 5
  }
];

export async function seedModules() {
  console.log("🌱 Seeding modules...");

  try {
    for (const moduleData of defaultModules) {
      const existingModule = await prisma.module.findUnique({
        where: { name: moduleData.name }
      });

      if (!existingModule) {
        await prisma.module.create({
          data: moduleData
        });
        console.log(`✅ Created module: ${moduleData.name}`);
      } else {
        console.log(`⏭️  Module already exists: ${moduleData.name}`);
      }
    }

    console.log("🎉 Modules seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding modules:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.main) {
  seedModules()
    .then(() => {
      console.log("✅ Modules seeding finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Modules seeding failed:", error);
      process.exit(1);
    });
} 