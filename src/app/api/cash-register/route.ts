import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET active shift for a cashier
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        // For simplicity in this POS, we might rely on client sending userId or user session
        // Let's assume the user ID is passed as a query param for now, or extracted from session.
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
        }

        const activeRegister = await prisma.cashRegister.findFirst({
            where: {
                userId: userId,
                closedAt: null,
            },
            include: {
                expenses: true,
                transactions: true,
            }
        });

        return NextResponse.json({ success: true, data: activeRegister });
    } catch (error: any) {
        console.error("Error fetching active cash register:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// POST opens a new shift
export async function POST(req: Request) {
    try {
        const { userId, openingCash } = await req.json();

        if (!userId || openingCash === undefined || openingCash < 0) {
            return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
        }

        // Check if there is already an active shift for this user
        const existing = await prisma.cashRegister.findFirst({
            where: { userId, closedAt: null }
        });

        if (existing) {
            return NextResponse.json({ success: false, error: "Shift already active" }, { status: 400 });
        }

        const newRegister = await prisma.cashRegister.create({
            data: {
                userId,
                openingCash: Number(openingCash),
            }
        });

        return NextResponse.json({ success: true, data: newRegister }, { status: 201 });
    } catch (error: any) {
        console.error("Error opening cash register:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT closes the active shift
export async function PUT(req: Request) {
    try {
        const { registerId, actualCash } = await req.json();

        if (!registerId || actualCash === undefined || actualCash < 0) {
            return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
        }

        const register = await prisma.cashRegister.findUnique({
            where: { id: registerId },
            include: {
                transactions: {
                    where: {
                        paymentStatus: "PAID"
                    },
                    include: { payments: true }
                },
                expenses: true
            }
        });

        if (!register || register.closedAt) {
            return NextResponse.json({ success: false, error: "Register not found or already closed" }, { status: 404 });
        }

        // Calculate expected cash = openingCash + totalCashSales - totalCashExpenses
        let totalCashSales = 0;
        register.transactions.forEach(tx => {
            const paymentTotal = tx.payments.reduce((sum, p) => sum + p.amount, 0);
            const change = Math.max(0, paymentTotal - tx.total);
            const cashPayments = tx.payments.filter(p => p.method === "CASH");
            const cashPaid = cashPayments.reduce((sum, p) => sum + p.amount, 0);
            const netCash = Math.max(0, cashPaid - change);

            totalCashSales += netCash;
        });

        let totalCashExpenses = 0;
        register.expenses.forEach(ex => {
            totalCashExpenses += ex.amount;
        });

        const expectedCash = register.openingCash + totalCashSales - totalCashExpenses;
        const difference = Number(actualCash) - expectedCash;

        const updated = await prisma.cashRegister.update({
            where: { id: registerId },
            data: {
                closedAt: new Date(),
                expectedCash,
                closingCash: Number(actualCash),
                difference
            }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error("Error closing cash register:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
