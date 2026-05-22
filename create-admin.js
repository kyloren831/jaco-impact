const { PrismaClient } = require("./generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: "admin@jacoimpact.com" }
    });

    if (existing) {
      console.log("Admin ya existe. Agregando rol ADMIN por si acaso...");
      await prisma.userRole.upsert({
        where: { userId_role: { userId: existing.id, role: "ADMIN" } },
        update: {},
        create: { userId: existing.id, role: "ADMIN" }
      });
      console.log("Rol ADMIN asegurado para", existing.email);
      return;
    }

    const hashedPassword = await bcrypt.hash("admin1234", 10);
    const user = await prisma.user.create({
      data: {
        name: "Admin de Pruebas",
        email: "admin@jacoimpact.com",
        password: hashedPassword,
        isActive: true,
        imageUrl: "",
        userRoles: {
          create: {
            role: "ADMIN"
          }
        },
        volunteers: {
          create: {
            phone: "00000000",
            nationality: "Costa Rica",
            profession: "Admin",
            emergencyContactName: "N/A",
            emergencyContactPhone: "00000000",
            inmediateAvailability: true,
          }
        }
      }
    });
    console.log("Usuario ADMIN creado exitosamente:", user.email);
    console.log("Contraseña: admin1234");
  } catch (error) {
    console.error("Error creando admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
