export interface Room {
    id: string;
    number: string;
    floor: string;
    type: string;
    bedType: string;
    available: boolean;
}

export interface KeyResponse {
    qrContent: string;
    token: string;
    expiresAt: Date;
}

export interface IPMSAdapter {
    /**
     * Update the guest's check-in status in the PMS.
     * @param reservationId Our internal reservation UUID
     * @param status e.g., 'CheckedIn', 'Verified'
     */
    updateGuestCheckinStatus(reservationId: string, status: string): Promise<void>;

    /**
     * Fetch available rooms matching certain criteria from the PMS.
     */
    getAvailableRooms(reservationId: string, criteria: { floor?: string; bedType?: string; type?: string }): Promise<Room[]>;

    /**
     * Assign a specific room to a reservation.
     */
    assignRoom(reservationId: string, roomId: string): Promise<void>;

    /**
     * Issue a mobile key (or trigger the PMS to send a key to the lock system).
     * Returns the key data we can encode in a QR code.
     */
    issueMobileKey(reservationId: string): Promise<KeyResponse>;
}