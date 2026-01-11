import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getUserProfile);

router.put(
  '/profile',
  [body('allergens').isArray().withMessage('Allergens must be an array')],
  updateUserProfile
);

export default router;
