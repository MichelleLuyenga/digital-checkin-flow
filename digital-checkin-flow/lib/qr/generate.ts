import { SignJWT, jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.QR_SIGNING_SECRET || 'fallback-secret');

export interface QRTokenPayload {
    sub: string; // reservation_id
    room: string;
    guest_name: string;
    iat: number;
    exp: number;
}

export async function createQRToken(payload: Omit<QRTokenPayload, 'iat' | 'exp'>): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 24 * 60 * 60; // 24 hours
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(secretKey);
}

export async function verifyQRToken(token: string): Promise<QRTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload as unknown as QRTokenPayload;
    } catch {
        return null;
    }
}