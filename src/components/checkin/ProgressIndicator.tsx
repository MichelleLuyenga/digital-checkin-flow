import { CheckinStep } from '../../lib/hooks/useCheckinFlow';
import { cn } from '../../lib/utils'; // simple cn helper

const steps: { key: CheckinStep; label: string }[] = [
    { key: 'identity', label: 'Identity' },
    { key: 'preferences', label: 'Room' },
    { key: 'qr', label: 'Key' },
];

export function ProgressIndicator({ current }: { current: CheckinStep }) {
    const currentIndex = steps.findIndex((s) => s.key === current);
    if (current === 'landing' || current === 'complete') return null;

    return (
        <div className="flex items-center justify-center space-x-2 mb-8">
            {steps.map((step, idx) => (
                <div key={step.key} className="flex items-center">
                    <div
                        className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                            idx <= currentIndex ? 'bg-slate-900 text-white' : 'bg-gray-200 text-gray-500'
                        )}
                    >
                        {idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`h-1 w-8 ${idx < currentIndex ? 'bg-slate-900' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}