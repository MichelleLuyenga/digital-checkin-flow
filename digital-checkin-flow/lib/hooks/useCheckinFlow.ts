'use client';
import { useState, useCallback } from 'react';

export type CheckinStep = 'landing' | 'identity' | 'preferences' | 'qr' | 'complete';

interface FlowState {
    step: CheckinStep;
    reservationId: string;
    data: {
        identityVerified?: boolean;
        preferencesSet?: boolean;
        qrToken?: string;
        roomNumber?: string;
    };
}

export function useCheckinFlow(reservationId: string) {
    const [state, setState] = useState<FlowState>({
        step: 'landing',
        reservationId,
        data: {},
    });

    const goTo = useCallback((step: CheckinStep, newData?: Partial<FlowState['data']>) => {
        setState((prev) => ({
            ...prev,
            step,
            data: { ...prev.data, ...newData },
        }));
    }, []);

    const updateData = useCallback((partial: Partial<FlowState['data']>) => {
        setState((prev) => ({
            ...prev,
            data: { ...prev.data, ...partial },
        }));
    }, []);

    return { ...state, goTo, updateData };
}