interface RateLimitData {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitData>;
  private windowMs: number;
  private max: number;

  constructor(windowMs: number, max: number) {
    this.limits = new Map();
    this.windowMs = windowMs;
    this.max = max;
  }

  async limit(ip: string): Promise<{ success: boolean }> {
    const now = Date.now();
    const limit = this.limits.get(ip);

    if (!limit || now >= limit.resetTime) {
      // No limit exists or window has expired, create new limit
      this.limits.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { success: true };
    }

    if (limit.count >= this.max) {
      return { success: false };
    }

    // Increment count
    limit.count++;
    return { success: true };
  }
}

// Create rate limiters with the same configuration as before
export const authLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const apiLimiter = new RateLimiter(60 * 1000, 60); // 60 requests per minute
export const redemptionLimiter = new RateLimiter(60 * 1000, 10); // 10 requests per minute 