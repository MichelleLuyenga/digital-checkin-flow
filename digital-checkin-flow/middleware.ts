import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Example: protect API routes (except qr validation) with a very basic auth
    if (request.nextUrl.pathname.startsWith('/api/checkin')) {
        // In production, you'd check an API key or service-to-service auth.
        // For demo, we allow all.
    }
    return NextResponse.next();
}