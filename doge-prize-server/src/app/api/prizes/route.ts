import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// Get all prizes
export async function GET() {
  try {
    const prizes = await prisma.prize.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(prizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    return NextResponse.json({ error: 'Failed to fetch prizes' }, { status: 500 });
  }
}

// Create a prize
export async function POST(request: Request) {
  try {
    const { amount, redemptionCode, type = 'Specific' } = await request.json();

    // Validate based on prize type
    if (type === 'Specific' && (!amount || !redemptionCode)) {
      return NextResponse.json(
        { error: 'Amount and redemption code are required for specific prizes' },
        { status: 400 }
      );
    }

    if (type === 'Random' && !redemptionCode) {
      return NextResponse.json(
        { error: 'Redemption code is required for random prizes' },
        { status: 400 }
      );
    }

    const prize = await prisma.prize.create({
      data: {
        amount: type === 'Specific' ? parseFloat(amount) : 0,
        redemptionCode,
        status: 'Available',
        type: type,
      },
    });

    await logAudit('CREATE', 'PRIZE', prize.id, `Created ${type.toLowerCase()} prize with redemption code ${redemptionCode}${type === 'Specific' ? `, amount ${amount}` : ''}`);

    return NextResponse.json(prize);
  } catch (error) {
    console.error('Error creating prize:', error);
    return NextResponse.json({ error: 'Failed to create prize' }, { status: 500 });
  }
}