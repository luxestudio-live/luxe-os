interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Time frame in milliseconds
  max: number;      // Max allowed requests in time frame
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 15 * 60 * 1000, max: 5 }
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.max - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (entry.count >= options.max) {
    const resetInSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.max - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function resetRateLimit(identifier: string) {
  rateLimitStore.delete(identifier);
}

