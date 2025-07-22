import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST as transferPrize } from '@/app/api/transfer/route';
import '@testing-library/jest-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Prize, PrizeStatus, PrizeType } from '@prisma/client';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    prize: {
      findFirst: jest.fn<() => Promise<Prize | null>>(),
      update: jest.fn<() => Promise<Prize>>(),
    },
  },
}));

// Mock the dogecoin library
jest.mock('@/lib/dogecoin', () => ({
  sendDogeFromWallet: jest.fn(),
}));

// Mock the audit library
jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
}));

describe('Transfer Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should transfer a valid redeemed prize', async () => {
    const mockPrize: Prize = {
      id: 1,
      redemptionCode: 'TEST123',
      amount: 100,
      status: PrizeStatus.Redeemed,
      type: PrizeType.Specific,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedPrize: Prize = {
      ...mockPrize,
      status: PrizeStatus.Transferred,
    };

    (prisma.prize.findFirst as jest.Mock<() => Promise<Prize | null>>).mockResolvedValue(mockPrize);
    (prisma.prize.update as jest.Mock<() => Promise<Prize>>).mockResolvedValue(updatedPrize);

    const { sendDogeFromWallet } = require('@/lib/dogecoin');
    sendDogeFromWallet.mockResolvedValue({ txid: 'test-transaction-id' });

    const request = new Request('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redemptionCode: 'TEST123',
        walletAddress: 'DTestWalletAddress123',
      }),
    });

    const response = await transferPrize(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Transaction submitted successfully',
      transactionHash: 'test-transaction-id',
      prize: {
        ...updatedPrize,
        createdAt: updatedPrize.createdAt.toISOString(),
        updatedAt: updatedPrize.updatedAt.toISOString(),
      },
    });

    // Verify that sendDogeFromWallet was called with correct parameters
    expect(sendDogeFromWallet).toHaveBeenCalledWith('DTestWalletAddress123', 100);

    // Verify that update was called with correct parameters
    expect(prisma.prize.update).toHaveBeenCalledWith({
      where: { id: mockPrize.id },
      data: { status: PrizeStatus.Transferred },
    });
  });

  it('should reject missing redemption code or wallet address', async () => {
    const request = new Request('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redemptionCode: 'TEST123',
        // Missing walletAddress
      }),
    });

    const response = await transferPrize(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Redemption code and wallet address are required',
    });
  });

  it('should reject invalid redemption code', async () => {
    (prisma.prize.findFirst as jest.Mock<() => Promise<Prize | null>>).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redemptionCode: 'INVALID123',
        walletAddress: 'DTestWalletAddress123',
      }),
    });

    const response = await transferPrize(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      message: 'Invalid redemption code',
    });
  });

  it('should reject already transferred prizes', async () => {
    const mockPrize: Prize = {
      id: 1,
      redemptionCode: 'TEST123',
      amount: 100,
      status: PrizeStatus.Transferred,
      type: PrizeType.Specific,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.prize.findFirst as jest.Mock<() => Promise<Prize | null>>).mockResolvedValue(mockPrize);

    const request = new Request('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redemptionCode: 'TEST123',
        walletAddress: 'DTestWalletAddress123',
      }),
    });

    const response = await transferPrize(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Prize has already been transferred',
    });
  });

  it('should reject prizes that are not redeemed', async () => {
    const mockPrize: Prize = {
      id: 1,
      redemptionCode: 'TEST123',
      amount: 100,
      status: PrizeStatus.Available,
      type: PrizeType.Specific,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.prize.findFirst as jest.Mock<() => Promise<Prize | null>>).mockResolvedValue(mockPrize);

    const request = new Request('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redemptionCode: 'TEST123',
        walletAddress: 'DTestWalletAddress123',
      }),
    });

    const response = await transferPrize(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Prize must be redeemed before it can be transferred',
    });
  });
}); 