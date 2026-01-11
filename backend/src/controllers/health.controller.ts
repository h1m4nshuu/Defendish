import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const uploadHealthRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new AppError('File required', 400);
    }

    const { profileId, fileType } = req.body;

    // Verify profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: req.userId! },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // In MVP, store file reference without OCR processing
    // In production, integrate OCR to extract health data
    const healthRecord = await prisma.healthRecord.create({
      data: {
        profileId,
        fileUrl: `/uploads/health/${req.file.filename}`,
        fileType: fileType || 'other',
        extractedData: '{}',
        allergies: '',
        diagnoses: '',
        medications: '',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Health record uploaded successfully',
      data: healthRecord,
    });
  } catch (error) {
    next(error);
  }
};

export const getHealthRecords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId } = req.params;

    // Verify profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: req.userId! },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    const records = await prisma.healthRecord.findMany({
      where: { profileId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const reportIncident = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { profileId, productId, symptoms, severity } = req.body;

    // Verify profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: req.userId! },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    const incident = await prisma.healthIncident.create({
      data: {
        profileId,
        productId: productId || null,
        symptoms,
        severity,
      },
    });

    // Generate action based on severity
    let actionTaken = '';
    if (severity === 'mild') {
      actionTaken = 'Monitor symptoms. Stay hydrated. Rest if needed. Consider over-the-counter remedies if appropriate.';
    } else if (severity === 'moderate') {
      actionTaken = 'Monitor closely. If symptoms worsen, consult a doctor. Keep emergency contacts ready.';
    } else if (severity === 'severe') {
      actionTaken = 'URGENT: Seek immediate medical attention. Call emergency services or visit nearest hospital.';
    }

    await prisma.healthIncident.update({
      where: { id: incident.id },
      data: { actionTaken },
    });

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: {
        incident: { ...incident, actionTaken },
        recommendation: actionTaken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId } = req.params;

    // Verify profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: req.userId! },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    const incidents = await prisma.healthIncident.findMany({
      where: { profileId },
      include: {
        product: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    next(error);
  }
};
