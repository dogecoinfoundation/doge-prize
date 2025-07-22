import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as checkPassword } from '@/app/api/auth/check-password/route';
import { POST as setPassword } from '@/app/api/auth/set-password/route';
import { hash, compare } from 'bcryptjs';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { User } from '@prisma/client';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn<() => Promise<User | null>>(),
      create: jest.fn<() => Promise<User>>(),
      update: jest.fn<() => Promise<User>>(),
    },
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn<() => Promise<string>>(),
  compare: jest.fn<() => Promise<boolean>>(),
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock next-auth/next
jest.mock('next-auth/next', () => ({
  NextAuth: jest.fn(() => ({
    GET: jest.fn(),
    POST: jest.fn(),
  })),
}));

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Check', () => {
    it('should return true when password is set', async () => {
      const mockUser = {
        id: 1,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock<() => Promise<User | null>>).mockResolvedValue(mockUser);

      const response = await checkPassword();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(true);
    });

    it('should return false when no user exists', async () => {
      (prisma.user.findFirst as jest.Mock<() => Promise<User | null>>).mockResolvedValue(null);

      const response = await checkPassword();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
    });
  });

  describe('Password Setting', () => {
    it('should create new user with password', async () => {
      const mockUser = {
        id: 1,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock<() => Promise<User | null>>).mockResolvedValue(null);
      (hash as jest.Mock<() => Promise<string>>).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock<() => Promise<User>>).mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'new_password',
        }),
      });

      const response = await setPassword(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(hash).toHaveBeenCalledWith('new_password', 12);
    });

    it('should not allow setting password if already set', async () => {
      const mockUser = {
        id: 1,
        password: 'existing_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock<() => Promise<User | null>>).mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'new_password',
        }),
      });

      const response = await setPassword(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Password already set. Use reset-password script to reset it.');
    });
  });
}); 