import { prisma } from "./lib/prisma";

async function main() {
  const count = await prisma.user.count();
  console.log("User count:", count);
}

main().catch(console.error).finally(() => process.exit(0));
