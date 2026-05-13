'use client';
import { useState, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Upload, Camera, Check } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

interface IdentityStepProps {
    reservationId: string;
    onComplete: () => void;
}

export function IdentityStep({ reservationId, onComplete }: IdentityStepProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [verified, setVerified] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const supabase = createClient();
        const fileName = `${reservationId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('identity-docs').upload(fileName, file);
        if (uploadError) {
            alert('Upload failed');
            setUploading(false);
            return;
        }
        // Get public URL
        const { data: urlData } = supabase.storage.from('identity-docs').getPublicUrl(fileName);
        const documentUrl = urlData.publicUrl;

        // Call API to verify
        const res = await fetch('/api/checkin/verify-identity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservationId, documentUrl }),
        });
        const result = await res.json();
        if (result.status === 'verified') {
            setVerified(true);
            onComplete();
        } else {
            alert('Identity verification failed: ' + (result.error || 'Retry'));
        }
        setUploading(false);
    };

    return (
        <div>
            <Card className="mb-4">
                {!file ? (
                    <div
                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:border-slate-500 transition"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Tap to upload ID or passport</span>
                        <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                        <Check className="text-green-600" />
                        <span className="text-sm">{file.name}</span>
                    </div>
                )}
            </Card>
            <Button
                className="w-full"
                disabled={!file || uploading}
                onClick={handleUpload}
            >
                {uploading ? 'Verifying...' : verified ? 'Verified ✓' : 'Verify Identity'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
                Your document is encrypted and checked against our secure provider.
            </p>
        </div>
    );
}