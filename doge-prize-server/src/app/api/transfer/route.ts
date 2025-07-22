import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDogeFromWallet } from '@/lib/dogecoin';
import { logAudit } from '@/lib/audit';

// Handle CORS preflight requests from browsers
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}

// Transfer a prize to a wallet address
export async function POST(request: Request) {
  try {
    const { redemptionCode, walletAddress } = await request.json();

    if (!redemptionCode || !walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Redemption code and wallet address are required' },
        { status: 400 }
      );
    }

    // Find the prize with the matching redemption code
    const prize = await prisma.prize.findFirst({
      where: {
        redemptionCode: redemptionCode,
      },
    });

    if (!prize) {
      return NextResponse.json(
        { success: false, message: 'Invalid redemption code' },
        { status: 404 }
      );
    }

    // Check if prize is already transferred
    if (prize.status === 'Transferred') {
      return NextResponse.json(
        { success: false, message: 'Prize has already been transferred' },
        { status: 400 }
      );
    }

    // Check if prize is available for transfer (must be redeemed first)
    if (prize.status !== 'Redeemed') {
      return NextResponse.json(
        { success: false, message: 'Prize must be redeemed before it can be transferred' },
        { status: 400 }
      );
    }

    // Send the DOGE transaction
    const result = await sendDogeFromWallet(walletAddress, prize.amount);

    // Update prize status to Transferred
    const updatedPrize = await prisma.prize.update({
      where: { id: prize.id },
      data: { status: 'Transferred' },
    });

    // Log the transfer
    await logAudit(
      'TRANSFER',
      'PRIZE',
      prize.id,
      `Transferred ${prize.amount} DOGE to address ${walletAddress} for redemption code ${redemptionCode}. Transaction ID: ${result.txid}`
    );

    return NextResponse.json({
      success: true,
      message: 'Transaction submitted successfully',
      transactionHash: result.txid,
      prize: updatedPrize,
    });
  } catch (error: any) {
    console.error('Error processing transfer:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 