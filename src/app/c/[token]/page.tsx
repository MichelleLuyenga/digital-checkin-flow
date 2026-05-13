import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { notFound } from 'next/navigation';
import { CheckinClient } from './client';
import { CheckinStep } from '../../../lib/hooks/useCheckinFlow';

export default async function CheckinPage({ params }: { params: { token: string } }) {
    const supabase = createServerSupabaseClient();
    const { data: session, error } = await supabase
        .from('checkin_sessions')
        .select('*, reservation:reservations(*)')
        .eq('token', params.token)
        .single();

    if (!session || new Date(session.expires_at) < new Date()) {
        notFound();
    }

    const reservation = session.reservation;
    // Determine initial step based on reservation status
    return <CheckinClient reservation={reservation} initialStep="landing" />;
}