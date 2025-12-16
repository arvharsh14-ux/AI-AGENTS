import { NextRequest } from 'next/server';
import { Redis } from 'ioredis';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 100,
};

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs };
  }

  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / config.windowMs)}`;

  try {
    const count = await redis.incr(windowKey);
    
    if (count === 1) {
      await redis.pexpire(windowKey, config.windowMs);
    }

    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = Math.ceil(now / config.windowMs) * config.windowMs;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt: now + config.windowMs };
  }
}

export async function rateLimitMiddleware(
  request: NextRequest,
  identifier: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const result = await checkRateLimit(identifier, config);

  const headers = {
    'X-RateLimit-Limit': config?.maxRequests.toString() || DEFAULT_CONFIG.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };

  return { allowed: result.allowed, headers };
}
