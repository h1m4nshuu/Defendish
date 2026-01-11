import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const createProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { name, dateOfBirth, bloodGroup, height, weight, relation, allergies, photoUrl } = req.body;

    const profile = await prisma.profile.create({
      data: {
        userId: req.userId!,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        bloodGroup,
        height,
        weight,
        relation,
        allergies: allergies && allergies.length > 0 ? JSON.stringify(allergies) : null,
        photoUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfiles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });

    // Parse allergies JSON string back to array
    const parsedProfiles = profiles.map(profile => ({
      ...profile,
      allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
    }));

    res.json({
      success: true,
      data: parsedProfiles,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId } = req.params;

    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: req.userId!,
      },
      include: {
        products: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Parse allergies JSON string back to array
    const parsedProfile = {
      ...profile,
      allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
    };

    res.json({
      success: true,
      data: parsedProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId } = req.params;
    const { name, dateOfBirth, bloodGroup, height, weight, relation, allergies, photoUrl } = req.body;

    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: req.userId!,
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        bloodGroup,
        height,
        weight,
        relation,
        allergies: allergies ? JSON.stringify(allergies) : undefined,
        photoUrl,
      },
    });

    // Parse allergies back to array for response
    const responseProfile = {
      ...updatedProfile,
      allergies: updatedProfile.allergies
        ? JSON.parse(updatedProfile.allergies)
        : [],
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: responseProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId } = req.params;

    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: req.userId!,
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    await prisma.profile.delete({ where: { id: profileId } });

    res.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPasswordForSwitch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401);
    }

    res.json({
      success: true,
      message: 'Password verified',
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePhoto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: { photoUrl },
    });
  } catch (error) {
    next(error);
  }
};
