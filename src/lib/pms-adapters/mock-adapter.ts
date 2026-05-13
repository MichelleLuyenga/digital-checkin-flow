import { IPMSAdapter, Room, KeyResponse } from './interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock PMS adapter that simulates Opera-like behaviour:
 * - Slow responses
 * - Occasional failures (triggered by reservation ID containing 'fail')
 * - Limited room availability logic
 */
export class MockPMSAdapter implements IPMSAdapter {
    private rooms: Room[] = [
        { id: 'room-101', number: '101', floor: '1', type: 'Standard', bedType: 'King', available: true },
        { id: 'room-202', number: '202', floor: '2', type: 'Standard', bedType: 'Queen', available: true },
        { id: 'room-303', number: '303', floor: '3', type: 'Deluxe', bedType: 'King', available: true },
        { id: 'room-404', number: '404', floor: '4', type: 'Suite', bedType: 'King', available: false },
    ];

    async updateGuestCheckinStatus(reservationId: string, status: string): Promise<void> {
        console.log(`[MockPMS] Updating reservation ${reservationId} status to ${status}`);
        // Simulate PMS delay (300-800ms)
        await this.delay(300 + Math.random() * 500);
        if (reservationId.includes('fail')) {
            throw new Error('PMS communication error: unable to update status');
        }
        // In a real adapter, this would call the PMS API.
    }

    async getAvailableRooms(reservationId: string, criteria: { floor?: string; bedType?: string; type?: string }): Promise<Room[]> {
        await this.delay(400);
        let filtered = this.rooms.filter((r) => r.available);
        if (criteria.floor) {
            filtered = filtered.filter((r) => r.floor === criteria.floor);
        }
        if (criteria.bedType) {
            filtered = filtered.filter((r) => r.bedType.toLowerCase() === criteria.bedType.toLowerCase());
        }
        if (criteria.type) {
            filtered = filtered.filter((r) => r.type.toLowerCase() === criteria.type.toLowerCase());
        }
        // If no rooms match, return empty (the UI should handle)
        return filtered;
    }

    async assignRoom(reservationId: string, roomId: string): Promise<void> {
        await this.delay(300);
        const room = this.rooms.find((r) => r.id === roomId);
        if (!room || !room.available) {
            throw new Error('Room is not available');
        }
        // Mark as unavailable in our mock
        room.available = false;
        console.log(`[MockPMS] Assigned room ${room.number} to reservation ${reservationId}`);
    }

    async issueMobileKey(reservationId: string): Promise<KeyResponse> {
        await this.delay(500);
        if (reservationId.includes('nokey')) {
            throw new Error('PMS lock system unavailable');
        }
        const token = uuidv4();
        return {
            qrContent: `hotelcheckin://qr/${token}`,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}