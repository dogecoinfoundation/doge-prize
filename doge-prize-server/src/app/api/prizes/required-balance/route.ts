import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get the required balance for all active prizes
export async function GET(request: Request) {
  const url = new URL(request.url);
  const timestamp = url.searchParams.get('t');
  
  console.log(`[${new Date().toISOString()}] Required Balance API called with timestamp: ${timestamp}`);
  
  try {
    const startTime = Date.now();
    
    // Get all prizes that don't have status 'Transferred'
    const activePrizes = await prisma.prize.findMany({
      where: {
        status: {
          not: 'Transferred'
        }
      },
      select: {
        amount: true,
        type: true
      }
    });

    // Calculate required balance for specific prizes
    const specificPrizesBalance = activePrizes
      .filter(prize => prize.type === 'Specific')
      .reduce((total, prize) => total + prize.amount, 0);

    // Count random prizes that haven't been transferred
    const activeRandomPrizesCount = activePrizes.filter(prize => prize.type === 'Random').length;

    // Get all prize pool entries and calculate their total value
    const prizePoolEntries = await prisma.prizePool.findMany({
      select: {
        amount: true,
        quantity: true
      }
    });

    const prizePoolTotal = prizePoolEntries.reduce((total: number, entry: { amount: number; quantity: number }) => total + (entry.amount * entry.quantity), 0);

    // Calculate total required balance
    // For specific prizes: use their actual amounts
    // For random prizes: use the total value of the prize pool (since any random prize could be redeemed)
    const requiredBalance = specificPrizesBalance + prizePoolTotal;
    
    const responseTime = Date.now() - startTime;
    const currentTime = new Date().toISOString();
    
    console.log(`[${currentTime}] Required Balance API response: requiredBalance=${requiredBalance}, activePrizes=${activePrizes.length}`);
    
    return NextResponse.json({
      success: true,
      requiredBalance,
      activePrizesCount: activePrizes.length,
      specificPrizesBalance,
      activeRandomPrizesCount,
      prizePoolTotal,
      lastUpdated: currentTime,
      responseTime: `${responseTime}ms`,
    });
  } catch (error: any) {
    const currentTime = new Date().toISOString();
    console.error(`[${currentTime}] Error calculating required balance:`, error);
    return NextResponse.json(
      { 
        error: `Failed to calculate required balance: ${error.message}`,
        lastUpdated: currentTime,
        success: false
      },
      { status: 500 }
    );
  }
} 