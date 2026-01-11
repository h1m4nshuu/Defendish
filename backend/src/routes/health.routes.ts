import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import {
  uploadHealthRecord,
  getHealthRecords,
  reportIncident,
  getIncidents,
} from '../controllers/health.controller';

const router = Router();
const upload = multer({ dest: 'uploads/health/' });

// All routes require authentication
router.use(authenticate);

router.post(
  '/records',
  upload.single('file'),
  uploadHealthRecord
);

router.get('/records/:profileId', getHealthRecords);

router.post(
  '/incidents',
  [
    body('profileId').notEmpty(),
    body('symptoms').notEmpty(),
    body('severity').isIn(['mild', 'moderate', 'severe']),
  ],
  reportIncident
);

router.get('/incidents/:profileId', getIncidents);

export default router;
