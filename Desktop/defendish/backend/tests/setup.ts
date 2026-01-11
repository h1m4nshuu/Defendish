import { PrismaClient } from '@prisma/client';

// Initialize Prisma client for testing
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db',
    },
  },
});

// Setup function - runs before all tests
beforeAll(async () => {
  console.log('🔧 Setting up test environment...');
  
  // Connect to database
  await prisma.$connect();
  console.log('✅ Test database connected');
});

// Cleanup function - runs after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Disconnect from database
  await prisma.$disconnect();
  console.log('✅ Test database disconnected');
});

// Clear database between tests
beforeEach(async () => {
  // Optional: Clear specific tables if needed
  // await prisma.user.deleteMany();
});

export default prisma;
