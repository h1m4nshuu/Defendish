import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { sendOTPEmail } from '../services/email.service';

const prisma = new PrismaClient();

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (userId: string): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  const secret = process.env.JWT_SECRET!;
  const options: SignOptions = { expiresIn };
  return jwt.sign({ userId }, secret, options);
};

export const signup = async (req: any, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false,
      },
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      success: true,
      message: 'Signup successful. Please verify OTP sent to your email.',
      data: { email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: any, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isVerified) {
      throw new AppError('Account already verified', 400);
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new AppError('No OTP found. Please request a new one.', 400);
    }

    if (new Date() > user.otpExpiresAt) {
      throw new AppError('OTP expired. Please request a new one.', 400);
    }

    if (user.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Verify user
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Account verified successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: any, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      throw new AppError('Validation failed', 400);
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('❌ User not found:', email);
      throw new AppError('Invalid credentials', 401);
    }
    console.log('✅ User found:', email, 'Verified:', user.isVerified);

    if (!user.isVerified) {
      throw new AppError('Please verify your account first', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      throw new AppError('Invalid credentials', 401);
    }

    console.log('✅ Password valid, generating token');
    const token = generateToken(user.id);
    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req: any, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isVerified) {
      throw new AppError('Account already verified', 400);
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiresAt },
    });

    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    next(error);
  }
};
