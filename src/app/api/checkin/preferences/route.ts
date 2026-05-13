import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getPMSAdapter } from '../../../../lib/pms-adapters';
import { enqueuePMSRetry } from '../../../../lib/queue/pms-retry';

export async function POST(request: NextRequest) {
    const { reservationId, floor_preference, bed_type } = await request.json();

    // 1. Save preferences in Supabase
    const { error } = await supabaseAdmin
        .from('preferences')
        .upsert({
            reservation_id: reservationId,
            floor_preference: floor_preference || null,
            bed_type: bed_type || null,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    // 2. Ask PMS for available rooms based on criteria
    const pms = getPMSAdapter();
    try {
        const rooms = await pms.getAvailableRooms(reservationId, {
            floor: floor_preference,
            bedType: bed_type,
        });
        if (rooms.length === 0) {
            // No rooms match exactly; in real flow, we’d ask the user to adjust.
            // For demo, we still proceed without assignment.
            return NextResponse.json({ room_assigned: null, message: 'No exact match, will assign at check-in' });
        }
        // Automatically assign first available
        await pms.assignRoom(reservationId, rooms[0].id);
        return NextResponse.json({ room_assigned: rooms[0].number });
    } catch (pmsError) {
        console.error('PMS room assignment error, queuing retry:', pmsError);
        enqueuePMSRetry(reservationId, 'preferences-updated', { floor_preference, bed_type });
        return NextResponse.json({ room_assigned: null, pending: true });
    }
}