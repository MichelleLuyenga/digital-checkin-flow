'use client';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface PreferencesStepProps {
    reservationId: string;
    onComplete: (selectedRoom?: string) => void;
}

export function PreferencesStep({ reservationId, onComplete }: PreferencesStepProps) {
    const [floor, setFloor] = useState('');
    const [bedType, setBedType] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        const res = await fetch('/api/checkin/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservationId, floor_preference: floor, bed_type: bedType }),
        });
        const data = await res.json();
        if (res.ok) {
            onComplete(data.room_assigned); // could pass room number
        } else {
            alert(data.error || 'Could not save preferences');
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Floor preference</label>
                <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 bg-white text-gray-900"
                >
                    <option value="">No preference</option>
                    <option value="1">1st floor</option>
                    <option value="2">2nd floor</option>
                    <option value="3">3rd floor</option>
                    <option value="4">4th floor</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Bed type</label>
                <select
                    value={bedType}
                    onChange={(e) => setBedType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 bg-white text-gray-900"
                >
                    <option value="">No preference</option>
                    <option value="King">King</option>
                    <option value="Queen">Queen</option>
                    <option value="Twin">Twin</option>
                </select>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Preferences & Continue'}
            </Button>
        </div>
    );
}