/*// Load environment variables from .env file
require('dotenv').config();

// Log the DATABASE_URL to verify it's loaded correctly
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

async function test() {
  try {
    // Fetch users from the database
    const users = await prisma.user.findMany();
    console.log('Users:', users);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect Prisma Client
    await prisma.$disconnect();
  }
}

// Run the test
test();*/
