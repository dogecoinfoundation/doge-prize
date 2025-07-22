import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all users (there should only be one)
  const result = await prisma.user.deleteMany();
  console.log(`Deleted ${result.count} user(s)`);
  
  // Create a new user without a password
  await prisma.user.create({
    data: {},
  });
  console.log("Created new user without password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 