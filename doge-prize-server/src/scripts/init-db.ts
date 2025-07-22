import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if a user exists
  const user = await prisma.user.findFirst();
  
  if (!user) {
    // Create a new user without a password
    await prisma.user.create({
      data: {},
    });
    console.log("Created new user without password");
  } else {
    console.log("User already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 