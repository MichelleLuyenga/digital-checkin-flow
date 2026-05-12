import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    const { token } = await request.json();
    const { data: session, error } = await supabaseAdmin
        .from('checkin_sessions')
        .select('reservation_id, expires_at')
        .eq('token', token)
        .single();

    if (!session || new Date(session.expires_at) < new Date()) {
        return NextResponse.json({ valid: false }, { status: 404 });
    }
    return NextResponse.json({ valid: true, reservationId: session.reservation_id });
}