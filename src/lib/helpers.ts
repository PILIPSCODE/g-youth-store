import { NextResponse } from "next/server";

/**
 * Standardized API response helper
 */
export function apiResponse<T>(data: T, status: number = 200, headers?: HeadersInit) {
    return NextResponse.json({ success: true, data }, { status, headers });
}

export function apiError(message: string, status: number = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Formats an integer amount to Indonesian Rupiah string
 */
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Generates an invoice number in format INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `INV-${date}-${random}`;
}

/**
 * Simple in-memory rate limiter
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (entry.count >= maxRequests) {
        return false;
    }

    entry.count++;
    return true;
}
