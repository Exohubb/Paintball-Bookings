import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (good for dev, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute per IP
};

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  
  // Check rate limit
  const clientData = rateLimitMap.get(ip);
  
  if (!clientData) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
  } else if (now > clientData.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
  } else if (clientData.count >= RATE_LIMIT.maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests, please slow down' },
      { status: 429 }
    );
  } else {
    clientData.count++;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
