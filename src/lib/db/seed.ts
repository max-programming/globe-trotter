import { db } from "./connection";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

if (import.meta.main) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
