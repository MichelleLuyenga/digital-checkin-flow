'use client';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

export function InstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShow(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => setShow(false));
        }
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border shadow-lg rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Install for faster check-in</span>
            <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShow(false)}>Later</Button>
                <Button size="sm" onClick={handleInstall}>Install</Button>
            </div>
        </div>
    );
}