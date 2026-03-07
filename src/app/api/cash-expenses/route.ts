import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get expenses for a specific register (optional, mostly for reports, but here if needed)
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const registerId = url.searchParams.get("registerId");

        if (!registerId) {
            return NextResponse.json({ success: false, error: "Missing registerId" }, { status: 400 });
        }

        const expenses = await prisma.cashExpense.findMany({
            where: { cashRegisterId: registerId },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ success: true, data: expenses });
    } catch (error: any) {
        console.error("Error fetching cash expenses:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// Record a new cash expense
export async function POST(req: Request) {
    try {
        const { registerId, amount, description } = await req.json();

        if (!registerId || !amount || amount <= 0 || !description) {
            return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
        }

        // verify register is open
        const register = await prisma.cashRegister.findUnique({
            where: { id: registerId }
        });

        if (!register || register.closedAt) {
            return NextResponse.json({ success: false, error: "Cash register is not open" }, { status: 400 });
        }

        const expense = await prisma.cashExpense.create({
            data: {
                cashRegisterId: registerId,
                amount: Number(amount),
                description
            }
        });

        return NextResponse.json({ success: true, data: expense }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating cash expense:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
