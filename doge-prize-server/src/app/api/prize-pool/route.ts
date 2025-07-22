import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// Get all prize pool items
export async function GET() {
  try {
    const prizePool = await prisma.prizePool.findMany({
      orderBy: {
        amount: 'asc',
      },
    });
    return NextResponse.json(prizePool);
  } catch (error) {
    console.error('Error fetching prize pool:', error);
    return NextResponse.json({ error: 'Failed to fetch prize pool' }, { status: 500 });
  }
}

// Add a new prize pool item
export async function POST(request: Request) {
  try {
    const { amount, quantity } = await request.json();

    if (!amount || quantity === undefined) {
      return NextResponse.json(
        { error: 'Amount and quantity are required' },
        { status: 400 }
      );
    }

    const prizePoolItem = await prisma.prizePool.upsert({
      where: { amount: parseFloat(amount) },
      update: {
        quantity: {
          increment: parseInt(quantity)
        }
      },
      create: {
        amount: parseFloat(amount),
        quantity: parseInt(quantity),
      },
    });

    await logAudit('CREATE', 'PRIZE_POOL', prizePoolItem.id, `Added ${quantity} prizes of ${amount} DOGE to pool`);

    return NextResponse.json(prizePoolItem);
  } catch (error) {
    console.error('Error creating prize pool item:', error);
    return NextResponse.json({ error: 'Failed to create prize pool item' }, { status: 500 });
  }
}

// Update a prize pool item
export async function PUT(request: Request) {
  try {
    const { id, amount, quantity } = await request.json();

    if (!id || !amount || quantity === undefined) {
      return NextResponse.json(
        { error: 'ID, amount, and quantity are required' },
        { status: 400 }
      );
    }

    const prizePoolItem = await prisma.prizePool.update({
      where: { id: parseInt(id) },
      data: {
        amount: parseFloat(amount),
        quantity: parseInt(quantity),
      },
    });

    await logAudit('UPDATE', 'PRIZE_POOL', prizePoolItem.id, `Updated prize pool item to ${quantity} prizes of ${amount} DOGE`);

    return NextResponse.json(prizePoolItem);
  } catch (error) {
    console.error('Error updating prize pool item:', error);
    return NextResponse.json({ error: 'Failed to update prize pool item' }, { status: 500 });
  }
}

// Delete a prize pool item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const prizePoolItem = await prisma.prizePool.delete({
      where: { id: parseInt(id) },
    });

    await logAudit('DELETE', 'PRIZE_POOL', prizePoolItem.id, `Deleted prize pool item with ${prizePoolItem.quantity} prizes of ${prizePoolItem.amount} DOGE`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prize pool item:', error);
    return NextResponse.json({ error: 'Failed to delete prize pool item' }, { status: 500 });
  }
} 