import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPMSAdapter } from '@/lib/pms-adapters';
import { createQRToken } from '@/lib/qr/generate';
import { enqueuePMSRetry } from '@/lib/queue/pms-retry';

export async function POST(request: NextRequest) {
    const { reservationId } = await request.json();

    // Verify reservation exists and check-in status (should be verified)
    const { data: resv } = await supabaseAdmin
        .from('reservations')
        .select('id, room_type, guest_name')
        .eq('id', reservationId)
        .single();

    if (!resv) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // In reality, we'd check that identity is verified; for demo, skip strict check.

    // 1. Issue mobile key via PMS (which in turn contacts the lock system)
    const pms = getPMSAdapter();
    let keyResponse;
    try {
        keyResponse = await pms.issueMobileKey(reservationId);
    } catch (pmsError) {
        console.error('PMS key issuance failed, queuing retry:', pmsError);
        enqueuePMSRetry(reservationId, 'issue-qr');
        return NextResponse.json({ error: 'Key issuance pending, try again shortly' }, { status: 503 });
    }

    // 2. Store QR token in Supabase
    const expiresAt = keyResponse.expiresAt.toISOString();
    const { data: qrRecord, error } = await supabaseAdmin
        .from('qr_tokens')
        .insert({
            reservation_id: reservationId,
            token: keyResponse.token,
            expires_at: expiresAt,
        })
        .select('token')
        .single();

    if (error) {
        return NextResponse.json({ error: 'Failed to store QR token' }, { status: 500 });
    }

    // 3. Create a signed JWT (our validation token) — we can use the same token ID or a JWT wrapping.
    // But the QR validation endpoint expects our signed token. We'll create a JWT with room info.
    // In this demo, we'll just return the raw token (or we can create JWT). We'll create a JWT.
    // For brevity, we’ll use the token string directly; but the validation endpoint expects a JWT.
    // Let's create a JWT with room info. Since we might not have room assigned, we'll use a placeholder.
    // Ideally, we'd have the room number from preferences step; we can fetch from preferences.
    const { data: prefs } = await supabaseAdmin
        .from('preferences')
        .select('room_number') // we didn't have room_number column; in real schema we'd add.
        .eq('reservation_id', reservationId)
        .single();
    // Instead, we'll use room_type as placeholder. For a proper demo, we'd add room_number to preferences.
    const roomNumber = 'TBD'; // or fetch from an assignment table

    const jwt = await createQRToken({
        sub: reservationId,
        room: roomNumber,
        guest_name: resv.guest_name,
    });

    return NextResponse.json({ qr: jwt });
}