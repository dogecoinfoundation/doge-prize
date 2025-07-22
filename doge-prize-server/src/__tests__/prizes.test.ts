import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/prizes/route';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Prize, PrizeStatus } from '@prisma/client';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    prize: {
      findMany: jest.fn<() => Promise<Prize[]>>(),
    },
  },
}));

describe('Prizes Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all prizes', async () => {
    const mockPrizes = [
      {
        id: 1,
        redemptionCode: 'TEST123',
        amount: 100,
        status: 'Available' as const,
        type: 'Specific' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        redemptionCode: 'TEST456',
        amount: 200,
        status: 'Redeemed' as const,
        type: 'Specific' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.prize.findMany as jest.Mock<() => Promise<Prize[]>>).mockResolvedValue(mockPrizes);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPrizes.map(prize => ({
      ...prize,
      createdAt: prize.createdAt.toISOString(),
      updatedAt: prize.updatedAt.toISOString(),
    })));
    expect(prisma.prize.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should handle database errors', async () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    (prisma.prize.findMany as jest.Mock<() => Promise<Prize[]>>).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch prizes' });
    
    // Verify that console.error was called with the expected error
    expect(console.error).toHaveBeenCalledWith('Error fetching prizes:', expect.any(Error));
    
    // Restore console.error
    console.error = originalConsoleError;
  });
}); 