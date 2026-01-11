import { Router } from 'express';
import { body } from 'express-validator';
import { signup, verifyOTP, login, resendOTP } from '../controllers/auth.controller';

const router = Router();

router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  signup
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
  ],
  verifyOTP
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

router.post(
  '/resend-otp',
  [body('email').isEmail().normalizeEmail()],
  resendOTP
);

export default router;
