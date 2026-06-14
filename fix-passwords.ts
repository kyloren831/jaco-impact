import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const users = await prisma.user.findMany();
  let updated = 0;
  for (const user of users) {
    if (!user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
      console.log(`Usuario con contraseña en texto plano encontrado: ${user.email} (Password: ${user.password})`);
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed }
      });
      updated++;
    }
  }
  console.log(`Listo. Se actualizaron ${updated} contraseñas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
