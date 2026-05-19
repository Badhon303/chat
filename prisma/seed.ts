import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  const password1 = await bcrypt.hash("password123", 12)
  const password2 = await bcrypt.hash("password123", 12)

  const userA = await prisma.user.upsert({
    where: { email: "b@cm.com" },
    update: {},
    create: {
      email: "b@cm.com",
      name: "Badhon Alam",
      password: password1,
      avatar: null,
    },
  })

  const userB = await prisma.user.upsert({
    where: { email: "m@cm.com" },
    update: {},
    create: {
      email: "m@cm.com",
      name: "Papri",
      password: password2,
      avatar: null,
    },
  })

  console.log("✅ Users created:")
  console.log(`   ${userA.email} (${userA.name})`)
  console.log(`   ${userB.email} (${userB.name})`)
  console.log("   Password for both: password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
