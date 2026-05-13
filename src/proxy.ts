import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    // Add any custom proxy logic here (e.g., auth checks)
    return NextResponse.next();
}