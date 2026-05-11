import { IPMSAdapter } from './interface';
import { MockPMSAdapter } from './mock-adapter';
import { OperaPMSAdapter } from './opera-adapter';

export function getPMSAdapter(): IPMSAdapter {
    const adapter = process.env.PMS_ADAPTER || 'mock';
    switch (adapter) {
        case 'opera':
            return new OperaPMSAdapter();
        case 'mock':
        default:
            return new MockPMSAdapter();
    }
}