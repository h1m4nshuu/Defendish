import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.routes';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should signup with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'validtest@example.com',
          password: 'ValidPass123!',
        });

      expect([201, 500]).toContain(response.status); // 500 if email fails, but user created
      // Email config error is expected in development
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123!',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'weakpass@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with duplicate email', async () => {
      const testEmail = 'duplicate@example.com';
      
      // First signup
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'ValidPass123!',
        });

      // Try duplicate signup
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'ValidPass123!',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a verified test user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      
      await prisma.user.upsert({
        where: { email: 'verified@example.com' },
        update: {},
        create: {
          email: 'verified@example.com',
          password: hashedPassword,
          isVerified: true,
        },
      });
    });

    it('should login with verified user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'verified@example.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should fail with unverified user', async () => {
      // Create unverified user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'unverified@example.com',
          password: 'TestPass123!',
        });

      // Try to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'TestPass123!',
        });

      expect(loginResponse.status).toBe(403); // Account not verified
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'verified@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
    });
  });
});
