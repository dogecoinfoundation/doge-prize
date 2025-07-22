import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// Delete a prize
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const prize = await prisma.prize.findUnique({
      where: { id }
    });

    if (!prize) {
      return NextResponse.json(
        { error: 'Prize not found' },
        { status: 404 }
      );
    }

    await prisma.prize.delete({
      where: { id }
    });

    await logAudit(
      'DELETE',
      'PRIZE',
      id,
      `Prize ${id} with amount ${prize.amount} and redemption code ${prize.redemptionCode} was deleted`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prize:', error);
    return NextResponse.json({ error: 'Failed to delete prize' }, { status: 500 });
  }
}

// Update a prize
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const { amount, redemptionCode, status, type } = await request.json();

    // Validate based on prize type
    if (type === 'Specific' || type === 'Assigned') {
      if (!amount || !redemptionCode || !status) {
        return NextResponse.json(
          { error: 'Amount, redemption code, and status are required for Specific and Assigned prizes' },
          { status: 400 }
        );
      }
    } else if (type === 'Random') {
      if (!redemptionCode || !status) {
        return NextResponse.json(
          { error: 'Redemption code and status are required for Random prizes' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Valid prize type is required' },
        { status: 400 }
      );
    }

    const currentPrize = await prisma.prize.findUnique({
      where: { id }
    });

    if (!currentPrize) {
      return NextResponse.json(
        { error: 'Prize not found' },
        { status: 404 }
      );
    }

    const updatedPrize = await prisma.prize.update({
      where: { id },
      data: {
        amount: (type === 'Specific' || type === 'Assigned') ? parseFloat(amount) : 0,
        redemptionCode: redemptionCode.trim(),
        status,
        type
      }
    });

    await logAudit(
      'UPDATE',
      'PRIZE',
      id,
      `Updated prize ${id}: type to ${type}, amount to ${(type === 'Specific' || type === 'Assigned') ? amount : 0}, redemption code to ${redemptionCode}, status to ${status}`
    );

    return NextResponse.json(updatedPrize);
  } catch (error) {
    console.error('Error updating prize:', error);
    return NextResponse.json({ error: 'Failed to update prize' }, { status: 500 });
  }
} 