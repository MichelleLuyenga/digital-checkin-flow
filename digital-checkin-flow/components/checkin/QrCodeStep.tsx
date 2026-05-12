'use client';
import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Download } from 'lucide-react';

interface QrCodeStepProps {
    reservationId: string;
    onComplete: () => void;
}

export function QrCodeStep({ reservationId, onComplete }: QrCodeStepProps) {
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/checkin/issue-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservationId }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.qr) {
                    setQrToken(data.qr);
                }
                setLoading(false);
            });
    }, [reservationId]);

    const qrUrl = qrToken ? `${window.location.origin}/api/qr/validate?token=${qrToken}` : '';

    return (
        <div className="text-center">
            <Card className="inline-block p-4 mb-4">
                {loading ? (
                    <div className="animate-pulse w-48 h-48 bg-gray-200 rounded" />
                ) : qrToken ? (
                    <QRCodeCanvas value={qrUrl} size={200} level="H" includeMargin />
                ) : (
                    <p className="text-red-500">Could not generate key</p>
                )}
            </Card>
            <p className="text-sm text-gray-600 mb-4">
                Scan this QR at the lobby kiosk or door lock to access your room.
            </p>
            <div className="flex space-x-2">
                <Button className="flex-1" onClick={() => onComplete()}>Done</Button>
                <Button variant="outline" className="flex-1" onClick={() => {/* trigger download as image */ }}>
                    <Download className="w-4 h-4 mr-1" /> Save
                </Button>
            </div>
        </div>
    );
}