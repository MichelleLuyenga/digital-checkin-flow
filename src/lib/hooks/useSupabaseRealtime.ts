'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export function useReservationStatus(reservationId: string) {
    const [status, setStatus] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        // Initial fetch
        supabase
            .from('reservations')
            .select('status')
            .eq('id', reservationId)
            .single()
            .then(({ data }) => {
                if (data) setStatus(data.status);
            });

        // Realtime subscription
        const channel = supabase
            .channel('reservation-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservations',
                    filter: `id=eq.${reservationId}`,
                },
                (payload) => {
                    setStatus(payload.new.status);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [reservationId, supabase]);

    return status;
}