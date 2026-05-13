import { NextRequest, NextResponse } from 'next/server';
import { verifyQRToken } from '../../../../lib/qr/generate';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 });
    }

    const payload = await verifyQRToken(token);
    if (!payload) {
        return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check that the token hasn't been revoked or already used (optional)
    // We could also check against qr_tokens table using the token identifier.
    // For now, just verify JWT.

    // Return guest info for door lock/display
    return NextResponse.json({
        valid: true,
        reservationId: payload.sub,
        room: payload.room,
        guest: payload.guest_name,
    });
}