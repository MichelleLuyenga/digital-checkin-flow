import { IKYCProvider, VerificationResult } from './provider';

export class MockKYCProvider implements IKYCProvider {
    async verifyDocument(documentUrl: string, reservationId: string): Promise<VerificationResult> {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1200));
        // Accept all documents except URLs containing 'reject'
        if (documentUrl.includes('reject')) {
            return { success: false, error: 'Document failed verification (mock)' };
        }
        return {
            success: true,
            referenceId: `kyc-${reservationId}-${Date.now()}`,
        };
    }
}