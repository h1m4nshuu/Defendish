import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { parseIngredients } from '../services/ingredient.service';
import { analyzeProductSuitability, extractDatesFromImage } from '../services/ai.service';
import { fetchProductByBarcode } from '../services/openfoodfacts.service';
import { DashboardStats, DashboardProduct } from '../types/dashboard.types';

const prisma = new PrismaClient();

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const {
      profileId,
      name,
      barcode,
      rawIngredients,
      manufacturingDate,
      expiryDate,
      dosage,
      storageInstructions,
    } = req.body;

    // Verify profile belongs to user
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: req.userId! },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Parse ingredients
    const ingredientsArray = parseIngredients(rawIngredients);

    const product = await prisma.product.create({
      data: {
        profileId,
        name,
        barcode,
        ingredients: JSON.stringify(ingredientsArray),
        rawIngredients,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        dosage,
        storageInstructions,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId, search, allergens, sortBy, sortOrder } = req.query;

    if (!profileId) {
      throw new AppError('Profile ID required', 400);
    }

    // Verify profile belongs to user
    const profile = await prisma.profile.findFirst({
      where: { id: profileId as string, userId: req.userId! },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Build where clause for search and filters
    const whereClause: any = { profileId: profileId as string };

    // Add search filter (case-insensitive)
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      if (searchTerm) {
        whereClause.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { barcode: { contains: searchTerm, mode: 'insensitive' } },
          { rawIngredients: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    // Fetch products with filters
    let products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Default sort
    });

    // Filter by allergens if provided (case-insensitive)
    if (allergens) {
      const allergenList = Array.isArray(allergens)
        ? allergens
        : [allergens];
      
      if (allergenList.length > 0) {
        products = products.filter((product) => {
          const ingredients = product.ingredients
            ? JSON.parse(product.ingredients)
            : [];
          
          return allergenList.some((allergen) =>
            ingredients.some((ingredient: string) =>
              ingredient.toLowerCase().includes((allergen as string).toLowerCase())
            )
          );
        });
      }
    }

    // Calculate expiry status for each product
    const now = new Date();
    const productsWithStatus = products.map((product) => {
      let expiryStatus = 'unknown';
      
      if (product.expiryDate) {
        const daysToExpiry = Math.ceil(
          (product.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysToExpiry < 0) {
          expiryStatus = 'expired';
        } else if (daysToExpiry <= 1) {
          expiryStatus = 'expiring_today';
        } else if (daysToExpiry <= 7) {
          expiryStatus = 'expiring_soon';
        } else {
          expiryStatus = 'fresh';
        }
      }

      return {
        ...product,
        ingredients: product.ingredients ? JSON.parse(product.ingredients) : [],
        expiryStatus,
      };
    });

    // Apply sorting
    const sortByField = (sortBy as string) || 'createdAt';
    const sortOrderDir = (sortOrder as string) || 'desc';

    productsWithStatus.sort((a: any, b: any) => {
      let compareValue = 0;

      switch (sortByField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'expiryDate':
          const aExpiry = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
          const bExpiry = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
          compareValue = aExpiry - bExpiry;
          break;
        case 'createdAt':
        default:
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrderDir === 'desc' ? -compareValue : compareValue;
    });

    res.json({
      success: true,
      data: productsWithStatus,
      meta: {
        total: productsWithStatus.length,
        filters: {
          search: search || null,
          allergens: allergens || null,
          sortBy: sortByField,
          sortOrder: sortOrderDir,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        profile: { userId: req.userId! },
      },
      include: {
        profile: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...product,
        ingredients: product.ingredients ? JSON.parse(product.ingredients) : [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const {
      name,
      barcode,
      rawIngredients,
      manufacturingDate,
      expiryDate,
      dosage,
      storageInstructions,
    } = req.body;

    // Verify product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        profile: { userId: req.userId! },
      },
      include: {
        profile: true,
      },
    });

    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }

    // Parse ingredients if provided
    let ingredientsArray: string[] | undefined;
    if (rawIngredients !== undefined) {
      ingredientsArray = parseIngredients(rawIngredients);
    }

    // Update product
    await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name !== undefined && { name }),
        ...(barcode !== undefined && { barcode }),
        ...(rawIngredients !== undefined && {
          rawIngredients,
          ingredients: JSON.stringify(ingredientsArray),
        }),
        ...(manufacturingDate !== undefined && {
          manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        }),
        ...(expiryDate !== undefined && {
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        }),
        ...(dosage !== undefined && { dosage }),
        ...(storageInstructions !== undefined && { storageInstructions }),
      },
    });

    // If ingredients were updated, re-run AI analysis
    if (ingredientsArray && rawIngredients !== undefined && existingProduct.suitabilityStatus) {
      const allergiesArray = existingProduct.profile.allergies
        ? JSON.parse(existingProduct.profile.allergies)
        : [];
      
      const aiRecommendation = await analyzeProductSuitability(
        ingredientsArray,
        allergiesArray,
        existingProduct.suitabilityStatus as 'safe' | 'unsafe'
      );

      await prisma.product.update({
        where: { id: productId },
        data: {
          aiRecommendation: JSON.stringify(aiRecommendation),
        },
      });
    }

    // Fetch updated product
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...updatedProduct,
        ingredients: updatedProduct?.ingredients ? JSON.parse(updatedProduct.ingredients) : [],
        aiRecommendation: updatedProduct?.aiRecommendation
          ? JSON.parse(updatedProduct.aiRecommendation)
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSuitability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { productId } = req.params;
    const { status, profileId } = req.body;

    // Verify product and profile
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        profileId,
        profile: { userId: req.userId! },
      },
      include: {
        profile: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Parse ingredients for AI analysis
    const ingredientsArray = product.ingredients ? JSON.parse(product.ingredients) : [];
    const allergiesArray = product.profile.allergies ? JSON.parse(product.profile.allergies) : [];
    
    // Run AI analysis
    const aiRecommendation = await analyzeProductSuitability(
      ingredientsArray,
      allergiesArray,
      status
    );

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        suitabilityStatus: status,
        aiRecommendation: JSON.stringify(aiRecommendation),
      },
    });

    res.json({
      success: true,
      message: 'Suitability updated successfully',
      data: {
        product: {
          ...updatedProduct,
          ingredients: updatedProduct.ingredients ? JSON.parse(updatedProduct.ingredients) : [],
          aiRecommendation: updatedProduct.aiRecommendation ? JSON.parse(updatedProduct.aiRecommendation) : null,
        },
        aiRecommendation,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        profile: { userId: req.userId! },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await prisma.product.delete({ where: { id: productId } });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const scanBarcode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { barcode, profileId } = req.body;

    // Verify profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: req.userId! },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // In MVP, return message that barcode lookup requires external API
    // In production, integrate with barcode API like Open Food Facts
    
    res.json({
      success: true,
      message: 'Barcode scanning requires manual entry in MVP',
      data: {
        barcode,
        suggestion: 'Please manually enter product details or use image scan',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const processImageOCR = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📸 OCR Request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      throw new AppError('Image file required', 400);
    }

    const { profileId } = req.body;
    console.log('Profile ID:', profileId);

    // Verify profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: req.userId! },
    });

    if (!profile) {
      console.log('❌ Profile not found');
      throw new AppError('Profile not found', 404);
    }

    console.log('📸 Processing image:', req.file.filename);
    console.log('📸 Image path:', req.file.path);
    
    // Extract dates using OCR (now requires file path instead of buffer)
    console.log('🔍 Starting OCR extraction...');
    const imagePath = req.file.path;
    const dateResult = await extractDatesFromImage(imagePath);
    
    console.log('📅 OCR Result:', {
      mfg: dateResult.manufacturingDate,
      exp: dateResult.expiryDate,
      confidence: dateResult.confidence,
      textLength: dateResult.rawText.length,
      qualityIssues: dateResult.qualityIssues,
    });
    
    res.json({
      success: true,
      message: 'Image processed successfully',
      data: {
        imageUrl: `/uploads/products/${req.file.filename}`,
        extractedText: dateResult.rawText,
        manufacturingDate: dateResult.manufacturingDate,
        expiryDate: dateResult.expiryDate,
        bestBeforeInfo: dateResult.bestBeforeInfo,
        calculatedExpiry: dateResult.calculatedExpiry,
        confidence: dateResult.confidence,
        qualityIssues: dateResult.qualityIssues,
        notes: dateResult.notes,
        warnings: dateResult.warnings,
      },
    });
  } catch (error: any) {
    console.error('❌ OCR Error:', error.message);
    console.error('Stack:', error.stack);
    next(error);
  }
};

export const scanIngredients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Validate image upload
    if (!req.file) {
      res.status(400).json({ 
        success: false,
        message: 'No image uploaded' 
      });
      return;
    }

    const imagePath = req.file.path;
    console.log('📸 Scanning ingredients from:', imagePath);
    
    // 2. Extract text using AI service (reuse existing OCR)
    const result = await extractDatesFromImage(imagePath);
    const text = result.rawText;

    console.log('📄 OCR Text extracted:', text.substring(0, 200) + '...');

    // 3. Parse ingredients from text
    const ingredients = parseIngredients(text);

    console.log('🥗 Ingredients found:', ingredients.length);

    // 4. Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (ingredients.length >= 5 && result.qualityIssues.length === 0) {
      confidence = 'high';
    } else if (ingredients.length >= 2) {
      confidence = 'medium';
    }

    // 5. Return results
    res.json({
      success: true,
      ingredients,
      rawText: text,
      confidence,
      qualityIssues: result.qualityIssues,
      count: ingredients.length,
    });
  } catch (error: any) {
    console.error('❌ Error scanning ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan ingredients',
      error: error.message,
    });
  }
};

/**
 * Lookup product information from OpenFoodFacts by barcode
 * POST /api/products/lookup
 */
export const lookupBarcode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { barcode } = req.body;

    if (!barcode || typeof barcode !== 'string' || barcode.trim().length === 0) {
      throw new AppError('Barcode is required', 400);
    }

    console.log(`🔍 Looking up barcode: ${barcode}`);

    // Call OpenFoodFacts service
    const result = await fetchProductByBarcode(barcode);

    // Handle service error (null response)
    if (result === null) {
      res.status(503).json({
        success: false,
        found: false,
        message: 'Product lookup service temporarily unavailable. Please try again or enter manually.',
      });
      return;
    }

    // Product not found in database
    if (!result.found) {
      res.json({
        success: true,
        found: false,
        barcode: result.barcode,
        message: 'Product not found in OpenFoodFacts database',
      });
      return;
    }

    // Product found - return data
    console.log(`✅ Product found: ${result.productName}`);
    
    res.json({
      success: true,
      found: true,
      data: {
        productName: result.productName,
        ingredients: result.ingredients,
        barcode: result.barcode,
        brand: result.brand,
        imageUrl: result.imageUrl,
        lastModified: result.lastModified,
      },
      message: 'Product found successfully',
    });
  } catch (error) {
    console.error('❌ Error in lookupBarcode:', error);
    next(error);
  }
};

/**
 * Get dashboard statistics and data
 * GET /api/products/dashboard
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    // Get user's allergens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { allergens: true },
    });

    const userAllergens: string[] = user?.allergens 
      ? JSON.parse(user.allergens) 
      : [];

    console.log(`📊 Fetching dashboard stats for user: ${userId}`);
    console.log(`👤 User allergens: ${userAllergens.join(', ') || 'None'}`);

    // Get all user's profiles
    const profiles = await prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });

    const profileIds = profiles.map(p => p.id);

    if (profileIds.length === 0) {
      // User has no profiles yet
      res.json({
        success: true,
        data: {
          totalProducts: 0,
          productsWithUserAllergens: 0,
          expiringThisWeek: 0,
          expiringProducts: [],
          recentProducts: [],
        } as DashboardStats,
      });
      return;
    }

    // Get all products for user's profiles
    const allProducts = await prisma.product.findMany({
      where: {
        profileId: { in: profileIds },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📦 Total products found: ${allProducts.length}`);

    // Calculate statistics
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Total products
    const totalProducts = allProducts.length;

    // Products with user allergens
    let productsWithUserAllergens = 0;

    // Expiring products
    const expiringProducts: DashboardProduct[] = [];

    // Process each product
    allProducts.forEach((product) => {
      const ingredients: string[] = product.ingredients 
        ? JSON.parse(product.ingredients as string) 
        : [];

      // Check for allergen matches
      const hasAllergens = userAllergens.length > 0 && ingredients.some((ingredient) =>
        userAllergens.some((allergen) =>
          ingredient.toLowerCase().includes(allergen.toLowerCase())
        )
      );

      const matchingAllergens = hasAllergens
        ? userAllergens.filter((allergen) =>
            ingredients.some((ingredient) =>
              ingredient.toLowerCase().includes(allergen.toLowerCase())
            )
          )
        : [];

      if (hasAllergens) {
        productsWithUserAllergens++;
      }

      // Check if expiring in next 7 days
      if (product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        if (expiryDate >= now && expiryDate <= sevenDaysFromNow) {
          expiringProducts.push({
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            ingredients,
            expiryDate: product.expiryDate,
            manufacturingDate: product.manufacturingDate,
            createdAt: product.createdAt,
            hasUserAllergens: hasAllergens,
            matchingAllergens,
          });
        }
      }
    });

    // Sort expiring products by expiry date (ascending - soonest first)
    expiringProducts.sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    // Get top 3 expiring products
    const topExpiringProducts = expiringProducts.slice(0, 3);

    // Get last 3 products added (recent products)
    const recentProducts: DashboardProduct[] = allProducts.slice(0, 3).map((product) => {
      const ingredients: string[] = product.ingredients 
        ? JSON.parse(product.ingredients as string) 
        : [];

      const hasAllergens = userAllergens.length > 0 && ingredients.some((ingredient) =>
        userAllergens.some((allergen) =>
          ingredient.toLowerCase().includes(allergen.toLowerCase())
        )
      );

      const matchingAllergens = hasAllergens
        ? userAllergens.filter((allergen) =>
            ingredients.some((ingredient) =>
              ingredient.toLowerCase().includes(allergen.toLowerCase())
            )
          )
        : [];

      return {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        ingredients,
        expiryDate: product.expiryDate,
        manufacturingDate: product.manufacturingDate,
        createdAt: product.createdAt,
        hasUserAllergens: hasAllergens,
        matchingAllergens,
      };
    });

    const dashboardStats: DashboardStats = {
      totalProducts,
      productsWithUserAllergens,
      expiringThisWeek: expiringProducts.length,
      expiringProducts: topExpiringProducts,
      recentProducts,
    };

    console.log(`✅ Dashboard stats calculated:`);
    console.log(`   - Total Products: ${totalProducts}`);
    console.log(`   - Products with Allergens: ${productsWithUserAllergens}`);
    console.log(`   - Expiring This Week: ${expiringProducts.length}`);

    res.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error('❌ Error in getDashboardStats:', error);
    next(error);
  }
};
