import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getKYCProvider } from '@/lib/kyc';
import { getPMSAdapter } from '@/lib/pms-adapters';
import { enqueuePMSRetry } from '@/lib/queue/pms-retry';

export async function POST(request: NextRequest) {
    const { reservationId, documentUrl } = await request.json();
    if (!reservationId || !documentUrl) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Verify document via KYC provider
    const kyc = getKYCProvider();
    const result = await kyc.verifyDocument(documentUrl, reservationId);
    if (!result.success) {
        return NextResponse.json({ error: result.error || 'Verification failed' }, { status: 400 });
    }

    // 2. Save to Supabase
    const { error: insertError } = await supabaseAdmin
        .from('identity_verifications')
        .insert({
            reservation_id: reservationId,
            document_url: documentUrl,
            status: 'verified',
            kyc_provider_ref: result.referenceId,
            verified_at: new Date().toISOString(),
        });

    if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 3. Update PMS (with retry on failure)
    const pms = getPMSAdapter();
    try {
        await pms.updateGuestCheckinStatus(reservationId, 'Verified');
    } catch (pmsError) {
        console.error('PMS update failed, queuing retry:', pmsError);
        enqueuePMSRetry(reservationId, 'identity-verified');
        // Proceed; the UI can show 'syncing'
    }

    return NextResponse.json({ status: 'verified' });
}