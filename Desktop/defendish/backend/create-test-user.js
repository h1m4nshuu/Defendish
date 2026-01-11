const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('✅ Test user already exists:', email);
      console.log('   Email:', email);
      console.log('   Password: password123');
      console.log('   Verified:', existingUser.isVerified);
      
      if (!existingUser.isVerified) {
        // Verify the user
        await prisma.user.update({
          where: { email },
          data: { isVerified: true, otp: null, otpExpiresAt: null }
        });
        console.log('✅ User has been verified');
      }
      
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isVerified: true, // Already verified for testing
        otp: null,
        otpExpiresAt: null,
      },
    });
    
    console.log('✅ Test user created successfully!');
    console.log('   Email:', email);
    console.log('   Password: password123');
    console.log('   User ID:', user.id);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
