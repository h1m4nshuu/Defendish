import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

const ALLOWED_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
];

export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        allergens: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const allergens = user.allergens ? JSON.parse(user.allergens) : [];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        allergens,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { allergens } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!Array.isArray(allergens)) {
      throw new AppError('Allergens must be an array', 400);
    }

    // Validate allergens
    const invalidAllergens = allergens.filter(
      (allergen) => !ALLOWED_ALLERGENS.includes(allergen)
    );

    if (invalidAllergens.length > 0) {
      throw new AppError(
        `Invalid allergens: ${invalidAllergens.join(', ')}`,
        400
      );
    }

    // Update user allergens
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        allergens: JSON.stringify(allergens),
      },
      select: {
        id: true,
        email: true,
        allergens: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const updatedAllergens = user.allergens ? JSON.parse(user.allergens) : [];

    res.json({
      success: true,
      message: 'Allergen profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        allergens: updatedAllergens,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
