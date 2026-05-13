import { IKYCProvider } from './provider';
import { MockKYCProvider } from './mock-provider';

export function getKYCProvider(): IKYCProvider {
    const provider = process.env.KYC_PROVIDER || 'mock';
    if (provider === 'onfido') {
        // In production, implement Onfido client
        throw new Error('Onfido adapter not implemented – use mock for demo');
    }
    return new MockKYCProvider();
}