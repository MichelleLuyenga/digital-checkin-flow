import { IPMSAdapter, Room, KeyResponse } from './interface';

export class OperaPMSAdapter implements IPMSAdapter {
    private endpoint: string;
    private username: string;
    private password: string;

    constructor() {
        this.endpoint = process.env.PMS_ENDPOINT || 'https://opera-pms/ows/';
        this.username = process.env.PMS_USERNAME || '';
        this.password = process.env.PMS_PASSWORD || '';
    }

    async updateGuestCheckinStatus(reservationId: string, status: string): Promise<void> {
        // Real implementation would:
        // 1. Build a SOAP envelope for OWS_UpdateReservation
        // 2. Set GuestStatus to the appropriate HTNG value
        // 3. Handle the Session/Credentials
        // This stub logs the gap.
        console.warn('[OperaPMS] SOAP update not implemented – real integration requires WSDL and certificate handling');
        throw new Error('Not implemented: use mock adapter for demo');
    }

    async getAvailableRooms(reservationId: string, criteria: { floor?: string; bedType?: string; type?: string }): Promise<Room[]> {
        console.warn('[OperaPMS] Fetching rooms via OWS_FetchRooms not implemented');
        throw new Error('Not implemented');
    }

    async assignRoom(reservationId: string, roomId: string): Promise<void> {
        console.warn('[OperaPMS] Room assignment via OWS_AssignRoom not implemented');
        throw new Error('Not implemented');
    }

    async issueMobileKey(reservationId: string): Promise<KeyResponse> {
        console.warn('[OperaPMS] Mobile key via Assa Abloy/Vostio integration not implemented');
        throw new Error('Not implemented');
    }
}