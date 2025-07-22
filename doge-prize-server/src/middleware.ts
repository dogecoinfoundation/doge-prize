import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authLimiter, apiLimiter, redemptionLimiter } from "@/lib/rate-limit";

// List of public API endpoints that don't require authentication
const publicEndpoints = [
  '/api/hello',
  '/api/redeem',
  '/api/transfer',
  '/api/auth/callback/credentials', // Allow NextAuth.js callback
  '/api/auth/session', // Allow session checks
  '/api/auth/signin', // Allow sign in
  '/api/auth/signout', // Allow sign out
  '/api/auth/csrf', // Allow CSRF token checks
  '/api/auth/providers', // Allow provider checks
  '/api/auth/check-password' // Allow password check
];

// CORS middleware
function corsMiddleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Get the origin from the request
  const origin = req.headers.get('origin') || req.headers.get('referer');
  
  // Allow requests from the same origin (for dogebox environment) or from localhost:3643 (for development)
  if (origin) {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || url.hostname === req.nextUrl.hostname) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
  } else {
    // Fallback for development environment
    response.headers.set("Access-Control-Allow-Origin", `http://localhost:3643`);
  }
  
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

// Auth middleware
export default withAuth(
  async function middleware(req) {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return corsMiddleware(req);
    }

    const path = req.nextUrl.pathname;

    // Get the IP address from the request
    const ip = req.ip ?? '127.0.0.1';

    // Apply rate limiting based on endpoint type
    if (path.startsWith('/api/auth/')) {
      // Skip rate limiting for session checks and CSRF tokens
      if (path === '/api/auth/session' || path === '/api/auth/csrf' || path === '/api/auth/providers') {
        return corsMiddleware(req);
      }

      const { success } = await authLimiter.limit(ip);
      if (!success) {
        console.log('Rate limit exceeded for auth endpoint:', path);
        return new NextResponse(
          JSON.stringify({ error: "Too many login attempts, please try again later." }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    } else if (path === '/api/redeem') {
      const { success } = await redemptionLimiter.limit(ip);
      if (!success) {
        console.log('Rate limit exceeded for redeem endpoint');
        return new NextResponse(
          JSON.stringify({ error: "Too many redemption attempts, please try again later." }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    } else if (path.startsWith('/api/')) {
      const { success } = await apiLimiter.limit(ip);
      if (!success) {
        console.log('Rate limit exceeded for API endpoint:', path);
        return new NextResponse(
          JSON.stringify({ error: "Too many requests, please try again later." }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    }

    // Check if the current path is a public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => {
      // For exact matches
      if (path === endpoint) return true;
      // For auth endpoints that have additional paths
      if (endpoint.startsWith('/api/auth/') && path.startsWith('/api/auth/')) return true;
      return false;
    });

    // Skip auth check for public endpoints
    if (!isPublicEndpoint && path.startsWith('/api/')) {
      // Check for authentication
      const token = await getToken({ req });
      if (!token) {
        console.log('No token found, returning 401');
        const response = new NextResponse(
          JSON.stringify({ error: "Authentication required" }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        return corsMiddleware(req);
      }
    }

    // Apply CORS headers
    return corsMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow access to auth pages and public API endpoints
        if (path.startsWith("/auth") || publicEndpoints.some(endpoint => path === endpoint)) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}; 