'use client';

import { PreferencesStep } from '../../../components/checkin/PreferencesStep';
import { IdentityStep } from '../../../components/checkin/IdentityStep';
import { QrCodeStep } from '../../../components/checkin/QrCodeStep';
import { ProgressIndicator } from '../../../components/checkin/ProgressIndicator';
import { StepWrapper } from '../../../components/checkin/StepWrapper';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useCheckinFlow, CheckinStep } from '../../../lib/hooks/useCheckinFlow';

interface CheckinClientProps {
    reservation: {
        id: string;
        guest_name: string;
        arrival_date: string;
        departure_date: string;
        room_type: string;
        status: string;
    };
    initialStep: CheckinStep;
}

export function CheckinClient({ reservation, initialStep }: CheckinClientProps) {
    const { step, goTo, data, updateData } = useCheckinFlow(reservation.id);

    if (step === 'landing') {
        return (
            <StepWrapper title={`Welcome, ${reservation.guest_name}`} description="Start your contactless check-in">
                <Card className="mb-4 space-y-2">
                    <div className="text-sm">Arrival: {reservation.arrival_date}</div>
                    <div className="text-sm">Departure: {reservation.departure_date}</div>
                    <div className="text-sm">Room type: {reservation.room_type}</div>
                </Card>
                <Button className="w-full" onClick={() => goTo('identity')}>
                    Begin Check-in
                </Button>
            </StepWrapper>
        );
    }

    return (
        <div className="px-4 py-8">
            <ProgressIndicator current={step} />
            {step === 'identity' && (
                <IdentityStep
                    reservationId={reservation.id}
                    onComplete={() => goTo('preferences', { identityVerified: true })}
                />
            )}
            {step === 'preferences' && (
                <PreferencesStep
                    reservationId={reservation.id}
                    onComplete={(room: string | undefined) => goTo('qr', { preferencesSet: true, roomNumber: room })}
                />
            )}
            {step === 'qr' && (
                <QrCodeStep
                    reservationId={reservation.id}
                    onComplete={() => goTo('complete')}
                />
            )}
            {step === 'complete' && (
                <StepWrapper title="You're all set! 🎉">
                    <p className="text-gray-600 mb-4">Your digital key is ready. Enjoy your stay.</p>
                    <Button className="w-full" onClick={() => goTo('qr')}>View QR again</Button>
                </StepWrapper>
            )}
        </div>
    );
}