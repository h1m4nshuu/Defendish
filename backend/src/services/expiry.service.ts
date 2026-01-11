import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendExpiryAlert } from './email.service';

const prisma = new PrismaClient();

export const checkExpiringProducts = async (): Promise<void> => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all products expiring within 7 days
    const expiringProducts = await prisma.product.findMany({
      where: {
        expiryDate: {
          lte: sevenDaysFromNow,
          gte: now,
        },
      },
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const product of expiringProducts) {
      const daysToExpiry = Math.ceil(
        (product.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send alerts for 7 days, 1 day, and 0 days (expired today)
      if (daysToExpiry === 7 || daysToExpiry === 1 || daysToExpiry === 0) {
        await sendExpiryAlert(
          product.profile.user.email,
          product.name,
          product.expiryDate!,
          daysToExpiry
        );
      }
    }

    console.log(`Checked ${expiringProducts.length} expiring products`);
  } catch (error) {
    console.error('Error checking expiring products:', error);
  }
};

export const startExpiryChecker = (): void => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running expiry check...');
    await checkExpiringProducts();
  });

  console.log('Expiry checker scheduled (daily at 9:00 AM)');
};
