import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  updateSuitability,
  deleteProduct,
  scanBarcode,
  processImageOCR,
  scanIngredients,
  lookupBarcode,
  getDashboardStats,
} from '../controllers/product.controller';

const router = Router();
const upload = multer({ dest: 'uploads/products/' });

// All routes require authentication
router.use(authenticate);

router.get('/dashboard', getDashboardStats);

router.post(
  '/',
  [
    body('profileId').notEmpty(),
    body('name').notEmpty(),
    body('rawIngredients').notEmpty(),
  ],
  createProduct
);

router.get('/', getProducts);
router.get('/:productId', getProduct);

router.put(
  '/:productId',
  [body('name').optional().notEmpty()],
  updateProduct
);

router.delete('/:productId', deleteProduct);

router.put(
  '/:productId/suitability',
  [
    body('status').isIn(['safe', 'unsafe']),
    body('profileId').notEmpty(),
  ],
  updateSuitability
);

router.post(
  '/scan-barcode',
  [body('barcode').notEmpty(), body('profileId').notEmpty()],
  scanBarcode
);

router.post(
  '/lookup',
  [body('barcode').notEmpty().isString()],
  lookupBarcode
);

router.post(
  '/scan-image',
  upload.single('image'),
  processImageOCR
);

router.post(
  '/scan-ingredients',
  upload.single('image'),
  scanIngredients
);

export default router;
