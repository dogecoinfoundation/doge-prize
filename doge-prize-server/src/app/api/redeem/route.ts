import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// Handle CORS preflight requests from browsers
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}

// Redeem a prize
export async function POST(request: Request) {
  try {
    const { redemptionCode } = await request.json();

    if (!redemptionCode) {
      return NextResponse.json(
        { valid: false, error: 'Redemption code is required' },
        { status: 400 }
      );
    }

    // Find the prize with the matching code
    const prize = await prisma.prize.findFirst({
      where: {
        AND: [
          { redemptionCode: { equals: redemptionCode } }
        ]
      }
    });

    if (!prize) {
      return NextResponse.json(
        { valid: false, error: 'Invalid redemption code' },
        { status: 404 }
      );
    }

    // Handle different prize types
    if (prize.type === 'Random') {
      // For random prizes, we need to get a random prize from the pool
      const availablePrizes = await prisma.prizePool.findMany({
        where: {
          quantity: {
            gt: 0
          }
        },
        orderBy: {
          amount: 'asc'
        }
      });

      if (availablePrizes.length === 0) {
        return NextResponse.json(
          { valid: false, error: 'No prizes available in the pool' },
          { status: 404 }
        );
      }

      // Select a random prize from available prizes
      const randomIndex = Math.floor(Math.random() * availablePrizes.length);
      const selectedPoolPrize = availablePrizes[randomIndex];

      // Update prize status to Redeemed if it's not already redeemed or transferred
      if (prize.status === 'Available') {
        await prisma.$transaction(async (tx) => {
          // Update the prize status, amount, and type
          await tx.prize.update({
            where: { id: prize.id },
            data: {
              status: 'Redeemed',
              amount: selectedPoolPrize.amount, // Update with the actual amount from pool
              type: 'Assigned', // Change type to Assigned
            }
          });

          // Decrease the quantity in the prize pool
          await tx.prizePool.update({
            where: { id: selectedPoolPrize.id },
            data: { quantity: selectedPoolPrize.quantity - 1 }
          });
        });

        // Log the redemption
        await logAudit(
          'REDEEM',
          'PRIZE',
          prize.id,
          `Random prize ${prize.id} with redemption code ${redemptionCode} was redeemed for ${selectedPoolPrize.amount} DOGE`
        );
      } else {
        // Log the prize view for already redeemed or transferred prizes
        await logAudit(
          'UPDATE',
          'PRIZE',
          prize.id,
          `Random prize ${prize.id} with redemption code ${redemptionCode} was viewed (status: ${prize.status})`
        );
      }

      return NextResponse.json(
        {
          valid: true,
          prize: {
            ...prize,
            amount: prize.status === 'Available' ? selectedPoolPrize.amount : prize.amount,
            type: prize.status === 'Available' ? 'Assigned' : prize.type,
          },
          message: prize.status === 'Available'
            ? `Random prize redeemed successfully! You won ${selectedPoolPrize.amount} DOGE`
            : `This prize was previously ${prize.status.toLowerCase()}`
        }
      );
    } else {
      // For specific prizes, use the existing logic
      if (prize.status === 'Available') {
        await prisma.prize.update({
          where: { id: prize.id },
          data: { status: 'Redeemed' }
        });

        // Log the redemption
        await logAudit(
          'REDEEM',
          'PRIZE',
          prize.id,
          `Specific prize ${prize.id} with redemption code ${redemptionCode} was redeemed for ${prize.amount} DOGE`
        );
      } else {
        // Log the prize view for already redeemed or transferred prizes
        await logAudit(
          'UPDATE',
          'PRIZE',
          prize.id,
          `Specific prize ${prize.id} with redemption code ${redemptionCode} was viewed (status: ${prize.status})`
        );
      }

      return NextResponse.json(
        { 
          valid: true, 
          prize: prize,
          message: prize.status === 'Available' 
            ? 'Redemption code redeemed successfully' 
            : `This prize was previously ${prize.status.toLowerCase()}`
        }
      );
    }
  } catch (error) {
    console.error('Error redeeming redemption code:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 