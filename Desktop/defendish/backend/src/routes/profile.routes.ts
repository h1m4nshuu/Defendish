import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware';
import {
  createProfile,
  getProfiles,
  getProfile,
  updateProfile,
  deleteProfile,
  verifyPasswordForSwitch,
  uploadProfilePhoto,
} from '../controllers/profile.controller';

const router = Router();

// Configure multer for profile photo uploads
const uploadsDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  [
    body('name').notEmpty(),
    body('relation').isIn(['self', 'child', 'parent', 'other']),
    body('allergies').optional().isArray(),
  ],
  createProfile
);

router.get('/', getProfiles);
router.get('/:profileId', getProfile);
router.put('/:profileId', updateProfile);
router.delete('/:profileId', deleteProfile);

router.post(
  '/verify-switch',
  [body('password').notEmpty()],
  verifyPasswordForSwitch
);

router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);

export default router;
