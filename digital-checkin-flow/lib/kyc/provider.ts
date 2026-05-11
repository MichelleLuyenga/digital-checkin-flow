export interface VerificationResult {
    success: boolean;
    referenceId?: string;
    error?: string;
}

export interface IKYCProvider {
    verifyDocument(documentUrl: string, reservationId: string): Promise<VerificationResult>;
}